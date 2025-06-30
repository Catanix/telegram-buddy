import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { instagramGetUrl } from "instagram-url-direct"

const TMP_DIR = 'tmp';

/**
 * Download media from an Instagram URL using instagram-url-direct
 * @param {string} url - Instagram URL
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadInstagramMedia(url) {
    try {
        console.log(`[Instagram Downloader] Using instagram-url-direct for: ${url}`);

        const result = await instagramGetUrl(url);

        console.log('[instagram-url-direct result]', JSON.stringify(result, null, 2));

        if (!result || !Array.isArray(result.url_list) || result.url_list.length === 0) {
            console.error('[Instagram Downloader] No media URLs found.');
            return null;
        }

        const mediaUrl = result.url_list[0];
        const mediaType = result.media_details?.[0]?.type || (mediaUrl.includes('.mp4') ? 'video' : 'photo');

        const { filePath } = await downloadMedia(mediaUrl, mediaType);
        return { filePath, mediaType };

    } catch (error) {
        console.error('[Instagram Downloader Error]', error);
        return null;
    }
}

async function downloadMedia(url, mediaType) {
    try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

        const ext = mediaType === 'video' ? 'mp4' : 'jpg';
        const filename = `instagram_${uuidv4()}.${ext}`;
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
