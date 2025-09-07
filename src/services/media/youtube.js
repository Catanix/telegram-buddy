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
        // Prioritize the original language audio track
        const audioTracks = info.player_response?.streamingData?.adaptiveFormats?.filter(f => f.mimeType.startsWith('audio/mp4'));
        let bestAudioFormat = null;
        if (audioTracks && audioTracks.length > 0) {
            // Find the default/original audio track if available
            const defaultTrack = info.videoDetails.audioTracks?.find(t => t.audioIsDefault);
            if (defaultTrack) {
                bestAudioFormat = audioTracks.find(f => f.audioTrack?.id === defaultTrack.id) || audioTracks.find(f => f.itag.toString() === defaultTrack.id);
            }
            // Fallback to the highest bitrate mp4 audio if no default is found
            if (!bestAudioFormat) {
                bestAudioFormat = audioTracks.sort((a, b) => b.bitrate - a.bitrate)[0];
            }
        }
        // Final fallback for cases where the above logic fails
        if (!bestAudioFormat) {
            bestAudioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: format => format.container === 'mp4' });
        }
        // --- End of Audio Selection ---


        const processQuality = (quality, maxSizeMB) => {
            // 1. Prioritize combined formats (no ffmpeg needed)
            const combinedFormat = info.formats.find(f =>
                f.qualityLabel === quality && f.hasVideo && f.hasAudio && f.container === 'mp4'
            );

            if (combinedFormat && combinedFormat.contentLength) {
                const sizeMB = Math.round(parseInt(combinedFormat.contentLength) / (1024 * 1024));
                if (sizeMB <= maxSizeMB) {
                    availableFormats.push({
                        quality: quality,
                        sizeMB,
                        itag: combinedFormat.itag,
                    });
                    return; // Found combined, we're done for this quality
                }
            }

            // 2. Fallback to separate streams (requires ffmpeg)
            // Prioritize mp4 with avc1 codec for max compatibility
            const videoFormat = ytdl.chooseFormat(info.formats, {
                quality: 'highestvideo',
                filter: (format) =>
                    format.qualityLabel === quality &&
                    format.container === 'mp4' &&
                    format.codecs?.startsWith('avc1') && // Prefer H.264
                    !format.hasAudio
            });

            if (videoFormat && bestAudioFormat) {
                const videoSize = videoFormat.contentLength ? parseInt(videoFormat.contentLength) : 0;
                const audioSize = bestAudioFormat.contentLength ? parseInt(bestAudioFormat.contentLength) : 0;
                const totalSizeMB = Math.round((videoSize + audioSize) / (1024 * 1024));

                if (totalSizeMB <= maxSizeMB) {
                    availableFormats.push({
                        quality: quality,
                        sizeMB: totalSizeMB,
                        videoItag: videoFormat.itag,
                        audioItag: bestAudioFormat.itag,
                    });
                }
            }
        };

        processQuality('720p', MAX_FILE_SIZE_720P_MB);
        processQuality('480p', MAX_FILE_SIZE_480P_MB);

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
 * Downloads a YouTube video by its itag(s).
 * @param {string} videoId - YouTube video ID
 * @param {number} videoItag - The itag of the video format (or combined format)
 * @param {number|null} audioItag - The itag of the audio format (if separate)
 * @param {string} title - The video title
 * @returns {Promise<{filePath: string}|null>}
 */
export async function downloadVideoByItag(videoId, videoItag, audioItag, title) {
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
            const audioStream = ytdl(url, { filter: format => format.itag === audioItag });
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
