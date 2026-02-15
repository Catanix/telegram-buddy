/**
 * Extract the first media URL (Instagram, TikTok, YouTube, Spotify or other) from text
 * @param {string} text - The text to extract URLs from
 * @returns {{ url: string, type: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'other' } | null}
 */
export function extractMediaUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0];

        // Instagram (reels/posts)
        if (/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[a-zA-Z0-9_-]+(?:\/|\?[^/\s]*)?/.test(url)) {
            console.log(`[TextHandler] Found instagram URL: ${url}`);
            return { url, type: 'instagram' };
        }

        // TikTok
        if (/https?:\/\/.+\.tiktok\.com\/[^\s]+/.test(url)) {
            console.log(`[TextHandler] Found tiktok URL: ${url}`);
            return { url, type: 'tiktok' };
        }

        // YouTube (videos/shorts)
        if (/https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/.test(url)) {
            console.log(`[TextHandler] Found youtube URL: ${url}`);
            return { url, type: 'youtube' };
        }

        // Spotify (tracks/playlists/albums)
        if (/https?:\/\/(?:open\.)?spotify\.com\/(?:track|playlist|album)\/[a-zA-Z0-9]+/.test(url)) {
            console.log(`[TextHandler] Found spotify URL: ${url}`);
            return { url, type: 'spotify' };
        }

        console.log(`[TextHandler] Found other URL: ${url}`);
        return { url, type: 'other' };
    }

    return null; // если нет URL в тексте
}
