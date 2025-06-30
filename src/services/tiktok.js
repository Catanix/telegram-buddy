import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = 'tmp';

/**
 * Download media from a TikTok URL using tikwm.com API
 * @param {string} url - TikTok video URL
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadTikTokMedia(url) {
    try {
        console.log(`[TikTok Downloader] Using tikwm.com API for: ${url}`);

        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || data.code !== 0 || !data.data?.play) {
            console.error('[TikTok Downloader] Failed to get media URL.', data);
            return null;
        }

        const mediaUrl = data.data.play; // This is the no-watermark video URL
        const mediaType = 'video';

        const { filePath } = await downloadMedia(mediaUrl, mediaType);
        return { filePath, mediaType };

    } catch (error) {
        console.error('[TikTok Downloader Error]', error);
        return null;
    }
}

async function downloadMedia(url, mediaType) {
    try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

        const ext = mediaType === 'video' ? 'mp4' : 'jpg';
        const filename = `tiktok_${uuidv4()}.${ext}`;
        const filePath = path.join(TMP_DIR, filename);

        console.log(`[Downloader] Downloading media: ${url}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch media: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);
        console.log(`[Downloader] Saved media to: ${filePath}`);

        return { filePath, mediaType };
    } catch (err) {
        console.error('[Download Media Error]', err);
        return { filePath: null, mediaType: null };
    }
}
