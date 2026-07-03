import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { chromium } from 'playwright';

const TMP_DIR = 'tmp';

/**
 * Download media from an Instagram URL using Playwright + embed page
 * No cookies required — works for all public posts, carousels, reels, photos
 * Returns array of {filePath, mediaType} for all media items
 * @param {string} url - Instagram URL
 * @returns {Promise<{files: Array<{filePath: string, mediaType: string}>}|null>}
 */
export async function downloadInstagramMedia(url) {
    try {
        console.log(`[Instagram Downloader] Starting: ${url}`);

        const shortcode = extractShortcode(url);
        if (!shortcode) {
            console.error('[Instagram Downloader] Invalid URL');
            return null;
        }

        if (!fs.existsSync(TMP_DIR)) {
            fs.mkdirSync(TMP_DIR, { recursive: true });
        }

        const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
        const mediaUrls = await scrapeEmbedPage(embedUrl);

        if (mediaUrls.length === 0) {
            console.error('[Instagram Downloader] No media found on embed page');
            return null;
        }

        console.log(`[Instagram Downloader] Found ${mediaUrls.length} media items`);

        const files = [];
        for (let i = 0; i < mediaUrls.length; i++) {
            const media = mediaUrls[i];
            const ext = media.type === 'video' ? 'mp4' : 'jpg';
            const filename = `instagram_${uuidv4()}.${ext}`;
            const filePath = path.join(TMP_DIR, filename);

            console.log(`[Instagram Downloader] Downloading ${i + 1}/${mediaUrls.length}: ${media.type}`);

            try {
                const response = await fetch(media.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });

                if (!response.ok) {
                    console.error(`[Instagram Downloader] Failed to fetch: ${response.status}`);
                    continue;
                }

                const buffer = Buffer.from(await response.arrayBuffer());
                fs.writeFileSync(filePath, buffer);
                console.log(`[Instagram Downloader] Saved: ${filePath} (${buffer.length} bytes)`);

                files.push({ filePath, mediaType: media.type });
            } catch (err) {
                console.error(`[Instagram Downloader] Download error: ${err.message}`);
            }
        }

        if (files.length === 0) {
            return null;
        }

        return { files };
    } catch (error) {
        console.error('[Instagram Downloader Error]', error.message);
        return null;
    }
}

/**
 * Scrape media URLs from Instagram embed page using Playwright
 * Clicks through carousel to collect all slides
 * @param {string} embedUrl - Instagram embed URL
 * @returns {Promise<Array<{type: string, url: string}>>}
 */
async function scrapeEmbedPage(embedUrl) {
    const browser = await chromium.launch({ headless: true });
    const allMedia = new Map(); // dedup by URL

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();
        await page.goto(embedUrl, { waitUntil: 'networkidle', timeout: 30000 });

        let hasNext = true;
        let clicks = 0;
        const maxClicks = 20; // Safety limit for carousel

        while (hasNext && clicks < maxClicks) {
            // Extract current slide media
            const currentMedia = await page.evaluate(() => {
                const result = [];

                // Images — get the largest version from srcset if available
                const images = document.querySelectorAll('img');
                images.forEach(img => {
                    if (img.src && img.src.includes('instagram') && img.src.includes('.jpg')) {
                        // Skip avatar/profile pics (small size indicators)
                        if (!img.src.includes('s100x100') && !img.src.includes('p240x240')) {
                            let bestUrl = img.src;
                            if (img.srcset) {
                                const candidates = img.srcset.split(',').map(s => {
                                    const [url, width] = s.trim().split(' ');
                                    return { url: url.trim(), width: parseInt(width) || 0 };
                                }).filter(c => c.url.includes('instagram'));
                                if (candidates.length > 0) {
                                    candidates.sort((a, b) => b.width - a.width);
                                    bestUrl = candidates[0].url;
                                }
                            }
                            result.push({ type: 'photo', url: bestUrl });
                        }
                    }
                });

                // Videos
                const videos = document.querySelectorAll('video');
                videos.forEach(v => {
                    if (v.src && v.src.includes('instagram')) {
                        result.push({ type: 'video', url: v.src });
                    }
                });

                // Video sources
                const sources = document.querySelectorAll('source');
                sources.forEach(s => {
                    if (s.src && s.src.includes('instagram')) {
                        result.push({ type: 'video', url: s.src });
                    }
                });

                return result;
            });

            currentMedia.forEach(m => {
                if (!allMedia.has(m.url)) {
                    allMedia.set(m.url, m);
                }
            });

            // Try to click next carousel button
            hasNext = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const ariaLabel = btn.getAttribute('aria-label') || '';
                    if (ariaLabel.toLowerCase().includes('next')) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });

            if (hasNext) {
                clicks++;
                await page.waitForTimeout(1000); // Wait for slide transition
            }
        }

    } catch (err) {
        console.error('[Instagram Playwright Error]', err.message);
    } finally {
        await browser.close();
    }

    return Array.from(allMedia.values());
}

/**
 * Extract shortcode from Instagram URL
 * @param {string} url
 * @returns {string|null}
 */
function extractShortcode(url) {
    const regex = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|tv|stories)\/([A-Za-z0-9-_]+)/;
    const match = url.match(regex);
    return match && match[2] ? match[2] : null;
}
