/**
 * Extract the first media URL (Instagram, TikTok, or other) from text
 * @param {string} text - The text to extract URLs from
 * @returns {{ url: string, type: 'instagram' | 'tiktok' | 'other' } | null}
 */
export function extractMediaUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0];

        if (/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[a-zA-Z0-9_-]+(?:\/|\?[^/\s]*)?/.test(url)) {
            console.log(`[TextHandler] Found instagram URL: ${url}`);
            return { url, type: 'instagram' };
        }

        if (/https?:\/\/(?:www|m|vm)\.tiktok\.com\/[^\s]+/.test(url)) {
            console.log(`[TextHandler] Found tiktok URL: ${url}`);
            return { url, type: 'tiktok' };
        }

        console.log(`[TextHandler] Found other URL: ${url}`);
        return { url, type: 'other' };
    }

    return null; // если нет URL в тексте
}
