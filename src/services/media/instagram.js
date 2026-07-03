import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { execFileSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { instagramGetUrl } from "instagram-url-direct"

const TMP_DIR = 'tmp';
const YT_DLP_PATH = path.resolve('yt-dlp');
const COOKIES_PATH = path.resolve('cookies.txt');

/**
 * Download media from an Instagram URL
 * Supports carousels (multiple photos/videos) — returns array of files
 * Falls back to yt-dlp with cookies if instagram-url-direct fails
 * @param {string} url - Instagram URL
 * @returns {Promise<{files: Array<{filePath: string, mediaType: string}>}|null>}
 */
export async function downloadInstagramMedia(url) {
    try {
        console.log(`[Instagram Downloader] Starting: ${url}`);

        // 1. Try instagram-url-direct (fast, no cookies needed when it works)
        const igResult = await tryInstagramUrlDirect(url);
        if (igResult && igResult.files.length > 0) {
            return igResult;
        }

        // 2. Fallback to yt-dlp with cookies if available
        if (fs.existsSync(COOKIES_PATH)) {
            console.log('[Instagram Downloader] Falling back to yt-dlp with cookies...');
            return await tryYtDlp(url);
        }

        console.error('[Instagram Downloader] No cookies available and instagram-url-direct failed.');
        return null;

    } catch (error) {
        console.error('[Instagram Downloader Error]', error.message);
        return null;
    }
}

async function tryInstagramUrlDirect(url) {
    try {
        console.log(`[Instagram Downloader] Trying instagram-url-direct...`);

        const result = await instagramGetUrl(url);
        console.log('[instagram-url-direct result]', JSON.stringify(result, null, 2).substring(0, 1000));

        if (!result || !Array.isArray(result.url_list) || result.url_list.length === 0) {
            console.log('[Instagram Downloader] instagram-url-direct returned no URLs');
            return { files: [] };
        }

        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

        const files = [];
        for (let i = 0; i < result.url_list.length; i++) {
            const mediaUrl = result.url_list[i];
            if (!mediaUrl) continue;

            const isVideo = mediaUrl.includes('.mp4') || result.media_details?.[i]?.type === 'video';
            const mediaType = isVideo ? 'video' : 'photo';
            const ext = isVideo ? 'mp4' : 'jpg';
            const filename = `instagram_${uuidv4()}.${ext}`;
            const filePath = path.join(TMP_DIR, filename);

            console.log(`[Instagram Downloader] Downloading item ${i + 1}/${result.url_list.length}: ${mediaType}`);

            const response = await fetch(mediaUrl);
            if (!response.ok) {
                console.error(`[Instagram Downloader] Failed to fetch item ${i + 1}: ${response.status}`);
                continue;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            console.log(`[Instagram Downloader] Saved: ${filePath} (${buffer.length} bytes)`);

            files.push({ filePath, mediaType });
        }

        return { files };
    } catch (err) {
        console.error('[Instagram Downloader] instagram-url-direct error:', err.message);
        return { files: [] };
    }
}

async function tryYtDlp(url) {
    try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

        const uniqueId = uuidv4();
        const outDir = path.join(TMP_DIR, `instagram_${uniqueId}`);
        fs.mkdirSync(outDir, { recursive: true });

        const outTemplate = path.join(outDir, '%(media_number)s_%(title).50s.%(ext)s');

        const args = [
            '--cookies', COOKIES_PATH,
            '--no-playlist',
            '-f', 'best',
            '--merge-output-format', 'mp4',
            '-o', outTemplate,
            '--no-warnings',
            url
        ];

        console.log(`[Instagram Downloader] yt-dlp args: ${args.join(' ')}`);

        const output = execFileSync(YT_DLP_PATH, args, {
            encoding: 'utf-8',
            timeout: 120000,
            maxBuffer: 1024 * 1024
        });

        console.log(`[Instagram Downloader] yt-dlp output: ${output.substring(0, 500)}`);

        const files = fs.readdirSync(outDir).map(f => {
            const filePath = path.join(outDir, f);
            const mediaType = f.endsWith('.mp4') ? 'video' : 'photo';
            return { filePath, mediaType };
        }).filter(f => f.filePath);

        if (files.length === 0) {
            console.error('[Instagram Downloader] yt-dlp returned no files');
            return null;
        }

        return { files };
    } catch (error) {
        console.error('[Instagram Downloader] yt-dlp error:', error.message);
        if (error.stdout) console.log('[yt-dlp stdout]', error.stdout.substring(0, 500));
        if (error.stderr) console.error('[yt-dlp stderr]', error.stderr.substring(0, 500));
        return null;
    }
}
