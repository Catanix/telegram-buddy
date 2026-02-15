import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = 'tmp';

/**
 * Resolve shortened TikTok URLs (vt.tiktok.com, vm.tiktok.com, etc.) to full URLs
 * @param {string} url - TikTok URL (may be shortened)
 * @returns {Promise<string>} - Resolved full URL
 */
async function resolveTikTokUrl(url) {
    // Check if it's a shortened URL
    const shortenedDomains = ['vt.tiktok.com', 'vm.tiktok.com', 't.tiktok.com'];
    const urlObj = new URL(url);
    
    if (shortenedDomains.some(domain => urlObj.hostname.includes(domain))) {
        console.log(`[TikTok Downloader] Resolving shortened URL: ${url}`);
        try {
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const resolvedUrl = response.url;
            console.log(`[TikTok Downloader] Resolved to: ${resolvedUrl}`);
            return resolvedUrl;
        } catch (error) {
            console.error('[TikTok Downloader] Failed to resolve URL, using original:', error.message);
            return url;
        }
    }
    return url;
}

/**
 * Download media from a TikTok URL using tikwm.com API
 * @param {string} url - TikTok video URL
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadTikTokMedia(url) {
    try {
        // Resolve shortened URLs first
        const resolvedUrl = await resolveTikTokUrl(url);
        
        console.log(`[TikTok Downloader] Using tikwm.com API for: ${resolvedUrl}`);

        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`;
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
