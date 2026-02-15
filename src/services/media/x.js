import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const TMP_DIR = 'tmp';

/**
 * Extract tweet ID from X/Twitter URL
 * @param {string} url - X/Twitter URL
 * @returns {string|null} - Tweet ID or null
 */
function extractTweetId(url) {
    // Support various X/Twitter URL formats:
    // https://x.com/username/status/1234567890
    // https://twitter.com/username/status/1234567890
    // https://x.com/i/status/1234567890
    const patterns = [
        /x\.com\/[^/]+\/status\/(\d+)/,
        /twitter\.com\/[^/]+\/status\/(\d+)/,
        /x\.com\/i\/status\/(\d+)/,
        /twitter\.com\/i\/status\/(\d+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

/**
 * Download media from X (Twitter) URL using Fxtwitter API
 * @param {string} url - X/Twitter URL
 * @returns {Promise<{text: string, author: object, media: array, replyTo: object|null}|null>}
 */
export async function downloadXMedia(url) {
    try {
        const tweetId = extractTweetId(url);
        
        if (!tweetId) {
            console.error('[X Downloader] Could not extract tweet ID from URL:', url);
            return null;
        }

        console.log(`[X Downloader] Fetching tweet ${tweetId} from Fxtwitter API`);

        const apiUrl = `https://api.fxtwitter.com/i/status/${tweetId}`;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.error('[X Downloader] Tweet not found (404)');
                return { error: 'not_found' };
            }
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.tweet) {
            console.error('[X Downloader] Invalid API response:', data);
            return null;
        }

        const tweet = data.tweet;
        
        // Extract author info
        const author = {
            name: tweet.author?.name || 'Unknown',
            username: tweet.author?.screen_name || 'unknown'
        };

        // Extract text
        const text = tweet.text || '';

        // Extract media
        const media = [];
        
        if (tweet.media) {
            // Photos
            if (tweet.media.photos && Array.isArray(tweet.media.photos)) {
                for (const photo of tweet.media.photos) {
                    media.push({
                        type: 'photo',
                        url: photo.url,
                        width: photo.width,
                        height: photo.height
                    });
                }
            }

            // Videos
            if (tweet.media.videos && Array.isArray(tweet.media.videos)) {
                for (const video of tweet.media.videos) {
                    media.push({
                        type: 'video',
                        url: video.url,
                        thumbnail: video.thumbnail_url,
                        duration: video.duration
                    });
                }
            }

            // GIFs (usually in videos array but with different type)
            if (tweet.media.animated_gif && Array.isArray(tweet.media.animated_gif)) {
                for (const gif of tweet.media.animated_gif) {
                    media.push({
                        type: 'gif',
                        url: gif.url,
                        thumbnail: gif.thumbnail_url
                    });
                }
            }
        }

        // Extract reply info
        let replyTo = null;
        if (tweet.replying_to && tweet.replying_to_status) {
            replyTo = {
                username: tweet.replying_to,
                statusId: tweet.replying_to_status
            };
        }

        // Check if this is a quote tweet
        let quote = null;
        if (tweet.quote) {
            quote = {
                text: tweet.quote.text,
                author: {
                    name: tweet.quote.author?.name,
                    username: tweet.quote.author?.screen_name
                }
            };
        }

        console.log(`[X Downloader] Found ${media.length} media items from @${author.username}`);

        return {
            text,
            author,
            media,
            replyTo,
            quote,
            tweetUrl: `https://x.com/${author.username}/status/${tweetId}`
        };

    } catch (error) {
        console.error('[X Downloader Error]', error);
        return null;
    }
}

/**
 * Download media file from URL to temp directory
 * @param {string} url - Media URL
 * @param {string} mediaType - 'photo' | 'video' | 'gif'
 * @returns {Promise<{filePath: string, mediaType: string}|null>}
 */
export async function downloadXMediaFile(url, mediaType) {
    try {
        if (!fs.existsSync(TMP_DIR)) {
            fs.mkdirSync(TMP_DIR, { recursive: true });
        }

        const ext = mediaType === 'photo' ? 'jpg' : 'mp4';
        const filename = `x_${mediaType}_${uuidv4()}.${ext}`;
        const filePath = path.join(TMP_DIR, filename);

        console.log(`[X Downloader] Downloading ${mediaType}: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch media: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filePath, buffer);

        console.log(`[X Downloader] Saved media to: ${filePath}`);

        return {
            filePath,
            mediaType: mediaType === 'photo' ? 'photo' : 'video'
        };

    } catch (error) {
        console.error('[X Media Download Error]', error);
        return null;
    }
}

/**
 * Format tweet text for Telegram with proper escaping
 * @param {string} text 
 * @returns {string}
 */
function escapeTelegramMarkdown(text) {
    // Escape special characters for Telegram MarkdownV2
    return text
        .replace(/\\/g, '\\\\')
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/>/g, '\\>')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\./g, '\\.')
        .replace(/!/g, '\\!');
}

/**
 * Format tweet info for Telegram message
 * @param {object} tweetData - Data from downloadXMedia
 * @returns {string} - Formatted message
 */
export function formatXMessage(tweetData) {
    const { text, author, replyTo, quote } = tweetData;
    
    let message = `🐦 **X Post** от [@${author.username}](https://x.com/${author.username})\n\n`;
    
    // Add tweet text if exists
    if (text && text.trim()) {
        // Truncate if too long
        let displayText = text;
        if (displayText.length > 800) {
            displayText = displayText.substring(0, 800) + '...';
        }
        message += escapeTelegramMarkdown(displayText) + '\n\n';
    }
    
    // Add reply context
    if (replyTo) {
        message += `↩️ *В ответ на [@${replyTo.username}](https://x.com/${replyTo.username})*\n\n`;
    }
    
    // Add quote context
    if (quote) {
        let quoteText = quote.text || '';
        if (quoteText.length > 200) {
            quoteText = quoteText.substring(0, 200) + '...';
        }
        message += `💬 *Цитирует [@${quote.author.username}](https://x.com/${quote.author.username}):*\n`;
        message += `_${escapeTelegramMarkdown(quoteText)}_\n\n`;
    }
    
    return message;
}
