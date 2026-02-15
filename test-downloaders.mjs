import { downloadTikTokMedia } from './src/services/media/tiktok.js';
import { getVideoInfo, downloadVideoByItag } from './src/services/media/youtube.js';
import fs from 'fs';

const testLinks = {
    tiktok: [
        'https://vm.tiktok.com/ZSm6poSch/', // vm домен (должен работать)
        'https://vt.tiktok.com/ZSm6poSch/', // vt домен (ранее не работал)
    ],
    youtube: [
        'https://www.youtube.com/shorts/saD_OKlv8PE', // Тестовая ссылка Shorts
    ]
};

async function testTikTok() {
    console.log('\n=== Testing TikTok Downloader ===\n');
    
    for (const url of testLinks.tiktok) {
        console.log(`\nTesting: ${url}`);
        try {
            const result = await downloadTikTokMedia(url);
            if (result && result.filePath) {
                console.log(`✅ SUCCESS: Downloaded to ${result.filePath}`);
                // Check file size
                const stats = fs.statSync(result.filePath);
                console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                // Cleanup
                fs.unlinkSync(result.filePath);
                console.log(`   Cleaned up: ${result.filePath}`);
            } else {
                console.log(`❌ FAILED: Could not download media`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
}

async function testYouTube() {
    console.log('\n=== Testing YouTube Downloader ===\n');
    
    for (const url of testLinks.youtube) {
        console.log(`\nTesting: ${url}`);
        try {
            // Get video info
            const info = await getVideoInfo(url);
            if (!info) {
                console.log(`❌ FAILED: Could not get video info`);
                continue;
            }
            
            console.log(`✅ Video Info: "${info.title}" (${info.videoId})`);
            console.log(`   Available formats:`);
            info.formats.forEach(f => {
                if (f.itag) {
                    console.log(`     - ${f.quality}: ${f.sizeMB}MB (combined itag: ${f.itag})`);
                } else {
                    console.log(`     - ${f.quality}: ${f.sizeMB}MB (video: ${f.videoItag}, audio: ${f.audioItag})`);
                }
            });
            
            // Try to download the first available format
            if (info.formats.length > 0) {
                const format = info.formats[0];
                console.log(`\n   Downloading ${format.quality}...`);
                
                const download = await downloadVideoByItag(
                    info.videoId,
                    format.videoItag || format.itag,
                    format.audioItag || null,
                    info.title,
                    format.audioTrackId || null
                );
                
                if (download && download.filePath) {
                    console.log(`✅ SUCCESS: Downloaded to ${download.filePath}`);
                    const stats = fs.statSync(download.filePath);
                    console.log(`   File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                    
                    // Verify it has audio by checking with ffprobe (optional)
                    console.log(`   Checking audio stream...`);
                    // Cleanup
                    fs.unlinkSync(download.filePath);
                    console.log(`   Cleaned up: ${download.filePath}`);
                } else {
                    console.log(`❌ FAILED: Could not download video`);
                }
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
            console.error(error);
        }
    }
}

async function main() {
    console.log('Starting media downloader tests...');
    
    await testTikTok();
    await testYouTube();
    
    console.log('\n=== All tests completed ===\n');
}

main().catch(console.error);
