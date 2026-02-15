import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ищет треки на Deezer по запросу.
 * @param {string} query
 * @returns {Promise<Array<{ label: string, url: string, artist: string, track: string, preview: string, link: string }>>}
 */
export async function searchMusic(query) {
    if (!query) throw new Error('Не передана строка запроса');

    try {
        const apiUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;
        
        const { data } = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        if (!data.data || !data.data.length) {
            return [];
        }

        return data.data.map(track => ({
            label: `${track.artist.name} - ${track.title}`,
            artist: track.artist.name,
            track: track.title,
            url: track.preview, // 30-sec preview URL (for compatibility)
            preview: track.preview,
            link: track.link, // Full track link on Deezer
            album: track.album?.title || '',
            cover: track.album?.cover || ''
        }));

    } catch (error) {
        console.error('Ошибка при поиске:', error.message);
        throw error;
    }
}

/**
 * Скачивает preview mp3 по ссылке
 * @param {string} url - Ссылка на preview mp3
 * @param {string} artist - Имя исполнителя
 * @param {string} track - Название трека
 * @returns {Promise<string>} Путь к сохранённому файлу
 */
export async function downloadMusic(url, artist, track) {
    try {
        if (!url) {
            throw new Error('URL не определен');
        }

        const filename = `${artist} - ${track} (preview).mp3`
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ');

        const filepath = path.join(process.cwd(), 'tmp', filename);

        // Создаем директорию
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

        // Скачиваем файл
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*'
            },
            timeout: 30000
        });

        const writer = fs.createWriteStream(filepath);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.pipe(writer);
        });

        return filepath;

    } catch (error) {
        console.error('Ошибка при скачивании:', error.message);
        throw new Error(`Ошибка при скачивании: ${error.message}`);
    }
}
