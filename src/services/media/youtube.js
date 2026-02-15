import fs from 'fs';
import path from 'path';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set the path for ffmpeg to the static binary
ffmpeg.setFfmpegPath(ffmpegPath);

const TMP_DIR = 'tmp';
const MAX_FILE_SIZE_720P_MB = 300;
const MAX_FILE_SIZE_480P_MB = 200;

/**
 * Gets information about a YouTube video, filtering for suitable formats.
 * @param {string} url - YouTube video URL
 * @returns {Promise<{title: string, videoId: string, formats: Array<{quality: string, sizeMB: number, itag?: number, videoItag?: number, audioItag?: number}>}|null>}
 */
export async function getVideoInfo(url) {
    try {
        console.log(`[YouTube Info] Processing: ${url}`);
        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }

        const info = await ytdl.getInfo(url);
        const videoId = info.videoDetails.videoId;
        const title = info.videoDetails.title;

        let availableFormats = [];

        // --- Improved Audio Format Selection ---
        // Get all available adaptive audio formats
        const audioFormats = info.player_response?.streamingData?.adaptiveFormats?.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));
        let bestAudioFormat = null;

        if (audioFormats && audioFormats.length > 0) {
            console.log(`[YouTube Info] Found ${audioFormats.length} audio format(s). Analyzing...`);
            
            audioFormats.forEach((f, i) => {
                const trackInfo = f.audioTrack ? 
                    `Track="${f.audioTrack.displayName}", Lang=${f.audioTrack.id}, Default=${f.audioTrack.audioIsDefault}` : 
                    'No track info';
                console.log(`[YouTube Info] - Format #${i}: Itag=${f.itag}, ${trackInfo}, Bitrate=${f.bitrate}, Codec=${f.codecs}`);
            });

            // Strategy: 
            // 1. Prefer formats WITH audioTrack info (more reliable)
            // 2. For videos with multiple tracks: audioIsDefault=true is usually the ORIGINAL
            // 3. For single track videos: take the highest bitrate
            
            const formatsWithTrackInfo = audioFormats.filter(f => f.audioTrack);
            
            if (formatsWithTrackInfo.length > 0) {
                // We have track info - use it to determine original audio
                // audioIsDefault=true typically means the original uploaded audio
                const defaultFormats = formatsWithTrackInfo.filter(f => f.audioTrack.audioIsDefault === true);
                
                if (defaultFormats.length > 0) {
                    console.log('[YouTube Info] Found default (original) audio track(s). Selecting highest bitrate.');
                    defaultFormats.sort((a, b) => b.bitrate - a.bitrate);
                    bestAudioFormat = defaultFormats[0];
                } else {
                    // No default marked - take highest bitrate from tracks with info
                    console.log('[YouTube Info] No default track found. Selecting highest bitrate from tracks with metadata.');
                    formatsWithTrackInfo.sort((a, b) => b.bitrate - a.bitrate);
                    bestAudioFormat = formatsWithTrackInfo[0];
                }
            } else {
                // No track info available - use highest bitrate
                console.log('[YouTube Info] No audio track metadata. Using highest bitrate audio.');
                audioFormats.sort((a, b) => b.bitrate - a.bitrate);
                bestAudioFormat = audioFormats[0];
            }

            if (bestAudioFormat) {
                const trackName = bestAudioFormat.audioTrack ? bestAudioFormat.audioTrack.displayName : 'unknown';
                console.log(`[YouTube Info] Selected audio: Itag=${bestAudioFormat.itag}, Track="${trackName}", Bitrate=${bestAudioFormat.bitrate}`);
            }
        }

        // Final fallback if no adaptive audio was found at all
        if (!bestAudioFormat) {
            console.log('[YouTube Info] Fallback: No adaptive audio found. Using ytdl-core highestaudio filter.');
            try {
                bestAudioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
            } catch (e) {
                console.log('[YouTube Info] Fallback failed:', e.message);
            }
        }
        // --- End of Audio Selection ---


        // Map quality labels for Shorts and regular videos
        const qualityMap = {
            '1080p': ['1080p', '1080p60', '1080p50', '1080p48'],
            '720p': ['720p', '720p60', '720p50', '720p48', 'hd'],
            '480p': ['480p', '480p60', 'sd'],
            '360p': ['360p', '360p60'],
            'shorts': ['1080p', '1080p60', '720p', '720p60', '480p', '480p60'] // Shorts often have different labeling
        };

        const processQuality = (qualityLabel, maxSizeMB, qualityAliases) => {
            const aliases = qualityAliases || [qualityLabel];
            
            // 1. Prioritize combined formats (no ffmpeg needed)
            const combinedFormat = info.formats.find(f =>
                aliases.includes(f.qualityLabel) && f.hasVideo && f.hasAudio && f.container === 'mp4'
            );

            if (combinedFormat && combinedFormat.contentLength) {
                const sizeMB = Math.round(parseInt(combinedFormat.contentLength) / (1024 * 1024));
                if (sizeMB <= maxSizeMB) {
                    console.log(`[YouTube Info] Found combined format for ${qualityLabel}: itag=${combinedFormat.itag}, size=${sizeMB}MB`);
                    availableFormats.push({
                        quality: qualityLabel,
                        sizeMB,
                        itag: combinedFormat.itag,
                    });
                    return; // Found combined, we're done for this quality
                }
            }

            // 2. Fallback to separate streams (requires ffmpeg)
            // Look for video-only formats matching our quality aliases
            const videoFormats = info.formats.filter(f => 
                aliases.includes(f.qualityLabel) && 
                f.hasVideo && 
                !f.hasAudio &&
                f.container === 'mp4'
            );
            
            // Sort by bitrate to get best quality
            videoFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            const videoFormat = videoFormats[0];

            if (videoFormat && bestAudioFormat) {
                const videoSize = videoFormat.contentLength ? parseInt(videoFormat.contentLength) : 0;
                const audioSize = bestAudioFormat.contentLength ? parseInt(bestAudioFormat.contentLength) : 0;
                const totalSizeMB = Math.round((videoSize + audioSize) / (1024 * 1024));

                if (totalSizeMB <= maxSizeMB) {
                    console.log(`[YouTube Info] Found separate streams for ${qualityLabel}: video_itag=${videoFormat.itag}, audio_itag=${bestAudioFormat.itag}, size=${totalSizeMB}MB`);
                    availableFormats.push({
                        quality: qualityLabel,
                        sizeMB: totalSizeMB,
                        videoItag: videoFormat.itag,
                        audioItag: bestAudioFormat.itag,
                        audioTrackId: bestAudioFormat.audioTrack?.id
                    });
                }
            }
        };

        // Try to find formats for different qualities
        // For Shorts, try higher qualities first as they're usually smaller
        const isShorts = url.includes('/shorts/') || info.videoDetails.isShort;
        
        if (isShorts) {
            console.log('[YouTube Info] Detected Shorts video - adjusting quality selection');
            // For Shorts, be more lenient with file sizes
            processQuality('720p', MAX_FILE_SIZE_720P_MB * 2, qualityMap['720p']);
            processQuality('1080p', MAX_FILE_SIZE_720P_MB * 2, qualityMap['1080p']);
            processQuality('480p', MAX_FILE_SIZE_480P_MB * 2, qualityMap['480p']);
        } else {
            processQuality('720p', MAX_FILE_SIZE_720P_MB, qualityMap['720p']);
            processQuality('480p', MAX_FILE_SIZE_480P_MB, qualityMap['480p']);
        }

        // Remove duplicates by quality, preferring the first one found (which will be the combined one)
        const uniqueFormats = availableFormats.reduce((acc, current) => {
            if (!acc.find(item => item.quality === current.quality)) {
                acc.push(current);
            }
            return acc;
        }, []);


        if (uniqueFormats.length === 0) {
            console.log('[YouTube Info] No suitable formats found for the given constraints.');
            return null;
        }

        return { title, videoId, formats: uniqueFormats };

    } catch (error) {
        console.error('[YouTube Info Error]', error.message);
        return null;
    }
}


/**
 * Downloads a YouTube video by its itag(s) and optionally a specific audio track ID.
 * @param {string} videoId - YouTube video ID
 * @param {number} videoItag - The itag of the video format (or combined format)
 * @param {number|null} audioItag - The itag of the audio format (if separate)
 * @param {string} title - The video title
 * @param {string|null} audioTrackId - The specific ID of the audio track to select
 * @returns {Promise<{filePath: string}|null>}
 */
export async function downloadVideoByItag(videoId, videoItag, audioItag, title, audioTrackId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const cleanTitle = title.replace(/[^\w\s.-]/gi, '').substring(0, 25);
    const uniqueId = uuidv4();

    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

    const finalFilename = `youtube_${uniqueId}_${cleanTitle}.mp4`;
    const finalFilePath = path.join(TMP_DIR, finalFilename);

    try {
        // If we have separate audio and video streams, merge them with ffmpeg
        if (audioItag) {
            console.log(`[Downloader] Downloading separate streams for: ${url} (V: ${videoItag}, A: ${audioItag})`);
            const videoPath = path.join(TMP_DIR, `video_${uniqueId}.mp4`);
            const audioPath = path.join(TMP_DIR, `audio_${uniqueId}.m4a`);

            // Download video stream
            const videoStream = ytdl(url, { filter: format => format.itag === videoItag });
            const videoWriteStream = fs.createWriteStream(videoPath);
            await new Promise((resolve, reject) => {
                videoStream.pipe(videoWriteStream);
                videoWriteStream.on('finish', resolve);
                videoWriteStream.on('error', reject);
            });
            console.log(`[Downloader] Video stream saved to: ${videoPath}`);


            // Download audio stream
            const audioStream = ytdl(url, {
                filter: format => {
                    // If an audioTrackId is provided, we must match it.
                    if (audioTrackId) {
                        return format.itag === audioItag && format.audioTrack?.id === audioTrackId;
                    }
                    // Otherwise, just match the itag (for backwards compatibility or simpler cases).
                    return format.itag === audioItag;
                }
            });
            const audioWriteStream = fs.createWriteStream(audioPath);
            await new Promise((resolve, reject) => {
                audioStream.pipe(audioWriteStream);
                audioWriteStream.on('finish', resolve);
                audioWriteStream.on('error', reject);
            });
            console.log(`[Downloader] Audio stream saved to: ${audioPath}`);


            // Merge with fluent-ffmpeg
            console.log('[Downloader] Merging video and audio with fluent-ffmpeg...');
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(videoPath)
                    .input(audioPath)
                    .outputOptions('-c:v copy') // Copy video stream without re-encoding
                    .outputOptions('-c:a copy') // Copy audio stream without re-encoding
                    .save(finalFilePath)
                    .on('end', resolve)
                    .on('error', (err) => {
                        console.error('[FFMPEG Error] Could not copy audio codec. Retrying with AAC re-encoding.', err.message);
                        // Fallback: If copying fails (e.g., incompatible formats), re-encode to AAC
                        ffmpeg()
                            .input(videoPath)
                            .input(audioPath)
                            .outputOptions('-c:v copy')
                            .outputOptions('-c:a aac')
                            .save(finalFilePath)
                            .on('end', resolve)
                            .on('error', reject); // If this also fails, reject
                    });
            });

            console.log(`[Downloader] Merged file saved to: ${finalFilePath}`);

            // Clean up temporary files
            fs.unlinkSync(videoPath);
            fs.unlinkSync(audioPath);

            return { filePath: finalFilePath };

        } else {
            // If we have a combined stream, download it directly
            console.log(`[Downloader] Downloading combined stream: ${url} with itag: ${videoItag}`);
            const videoStream = ytdl(url, { filter: format => format.itag === videoItag });
            const writeStream = fs.createWriteStream(finalFilePath);

            await new Promise((resolve, reject) => {
                videoStream.pipe(writeStream);
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            console.log(`[Downloader] Saved video to: ${finalFilePath}`);
            return { filePath: finalFilePath };
        }

    } catch (err) {
        console.error('[Download Video Error]', err);
        // Cleanup failed downloads
        const files = fs.readdirSync(TMP_DIR).filter(f => f.includes(uniqueId));
        for (const file of files) {
            fs.unlinkSync(path.join(TMP_DIR, file));
        }
        return null;
    }
}
