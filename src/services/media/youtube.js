import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = 'tmp';
const YT_DLP_PATH = path.resolve('yt-dlp');

/**
 * Download media from a YouTube URL (videos or shorts)
 * Returns a single combined video file (audio + video already merged)
 * No quality selection — always downloads best available combined format <=720p
 * @param {string} url - YouTube URL
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadYouTubeMedia(url) {
    try {
        console.log(`[YouTube Downloader] Starting download: ${url}`);

        if (!fs.existsSync(TMP_DIR)) {
            fs.mkdirSync(TMP_DIR, { recursive: true });
        }

        const uniqueId = uuidv4();
        const outTemplate = path.join(TMP_DIR, `youtube_${uniqueId}.%(ext)s`);

        const args = [
            '--no-playlist',
            '-f', 'best[height<=720][vcodec!=none][acodec!=none]/best[height<=720]/best',
            '--merge-output-format', 'mp4',
            '-o', outTemplate,
            '--no-warnings',
            url
        ];

        console.log(`[YouTube Downloader] yt-dlp args: ${args.join(' ')}`);

        const output = execFileSync(YT_DLP_PATH, args, {
            encoding: 'utf-8',
            timeout: 120000,
            maxBuffer: 1024 * 1024
        });

        console.log(`[YouTube Downloader] yt-dlp output: ${output.substring(0, 500)}`);

        // Find the downloaded file
        const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(`youtube_${uniqueId}`));
        if (files.length === 0) {
            console.error('[YouTube Downloader] No file found after download');
            return null;
        }

        const filePath = path.join(TMP_DIR, files[0]);
        console.log(`[YouTube Downloader] Downloaded: ${filePath} (${fs.statSync(filePath).size} bytes)`);

        return { filePath, mediaType: 'video' };
    } catch (error) {
        console.error('[YouTube Downloader Error]', error.message);
        if (error.stdout) console.log('[YouTube Downloader stdout]', error.stdout.substring(0, 500));
        if (error.stderr) console.error('[YouTube Downloader stderr]', error.stderr.substring(0, 500));
        return null;
    }
}
