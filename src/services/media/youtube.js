import fs from 'fs';
import path from 'path';
import ytdl from '@distube/ytdl-core';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = 'tmp';
const MAX_FILE_SIZE_MB = 300;

/**
 * Downloads a YouTube video in 720p (or lower if 720p is unavailable)
 * @param {string} url - YouTube video URL
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadYouTubeVideo(url) {
    try {
        console.log(`[YouTube Downloader] Processing: ${url}`);

        if (!ytdl.validateURL(url)) {
            throw new Error('Invalid YouTube URL');
        }

        const info = await ytdl.getInfo(url);
        const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');

        // Select the best available quality up to 720p (with audio)
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestvideo',
            filter: (format) =>
                format.hasVideo &&
                format.hasAudio &&
                (format.qualityLabel === '720p' ||
                    format.qualityLabel === '480p' ||
                    format.qualityLabel === '360p')
        });

        if (!format) {
            throw new Error('No suitable format found (720p or lower)');
        }

        // Проверяем размер видео
        const contentLength = format.contentLength || format.clen;
        if (contentLength) {
            const fileSizeMB = Math.round(contentLength / (1024 * 1024));
            console.log(`[YouTube Downloader] Estimated size: ${fileSizeMB}MB`);

            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                throw new Error(`Video too large (${fileSizeMB}MB > ${MAX_FILE_SIZE_MB}MB limit)`);
            }
        }

        console.log(`[YouTube Downloader] Selected quality: ${format.qualityLabel}`);

        const { filePath } = await downloadVideo(url, format, videoTitle);
        return { filePath, mediaType: 'video' };

    } catch (error) {
        console.error('[YouTube Downloader Error]', error.message);
        return null;
    }
}

async function downloadVideo(url, format, title) {
    try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

        const filename = `youtube_${uuidv4()}_${title.substring(0, 20)}.mp4`;
        const filePath = path.join(TMP_DIR, filename);

        console.log(`[Downloader] Downloading video: ${url}`);

        const videoStream = ytdl(url, { format });
        const writeStream = fs.createWriteStream(filePath);

        await new Promise((resolve, reject) => {
            videoStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        console.log(`[Downloader] Saved video to: ${filePath}`);
        return { filePath };

    } catch (err) {
        console.error('[Download Video Error]', err);
        return { filePath: null };
    }
}
