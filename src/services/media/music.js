import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ищет до 5 треков на muzofond.fm по запросу.
 * @param {string} query
 * @returns {Promise<Array<{ label: string, url: string, artist: string, track: string }>>}
 */
export async function searchMusic(query) {
    if (!query) throw new Error('Не передана строка запроса');

    const encoded = encodeURIComponent(query);
    const searchUrl = `https://muzofond.fm/search/${encoded}`;

    try {
        const { data: html } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 30000 // 30 секунд таймаут
        });

        const items = html.split('<li class="item"').slice(1);

        if (!items.length) {
            return [];
        }

        const results = [];

        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const item = items[i];
            try {
                const urlMatch = item.match(/data-url="([^"]+)"/);
                const artistMatch = item.match(/<span class="artist"[^>]*>([^<]+)<\/span>/);
                const trackMatch = item.match(/<span class="track"[^>]*>([^<]+)<\/span>/);

                if (artistMatch && trackMatch && urlMatch) {
                    const artist = decodeHtml(artistMatch[1].trim());
                    const track = decodeHtml(trackMatch[1].trim());
                    const url = urlMatch[1];

                    // Проверяем формат URL
                    if (!url) {
                        continue;
                    }

                    const label = `${artist} - ${track}`;
                    results.push({
                        label,
                        url,
                        artist,
                        track
                    });
                }
            } catch (itemError) {
                console.error('Ошибка при обработке трека:', itemError.message);
            }
        }

        return results;

    } catch (error) {
        console.error('Ошибка при поиске:', error.message);
        throw error;
    }
}

/**
 * Скачивает mp3 по ссылке
 * @param {string} url - Ссылка на mp3
 * @param {string} artist - Имя исполнителя
 * @param {string} track - Название трека
 * @returns {Promise<string>} Путь к сохранённому файлу
 */
export async function downloadMusic(url, artist, track) {
    try {
        // Проверяем, содержит ли URL уже префикс
        let fullUrl;
        if (!url) {
            throw new Error('URL не определен');
        } else if (typeof url !== 'string') {
            throw new Error(`Неверный тип URL: ${typeof url}`);
        } else if (url.startsWith('https://')) {
            fullUrl = url;
        } else if (url.startsWith('http://')) {
            fullUrl = url.replace('http://', 'https://');
        } else if (url.includes('muzofond.fm')) {
            fullUrl = url;
        } else {
            fullUrl = `https://dl3s4.muzofond.fm/${url}`;
        }

        const filename = `${artist} - ${track}.mp3`
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ');

        const filepath = path.join(process.cwd(), 'downloads', filename);

        // Создаем директорию для сохранения файла
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

        // Скачиваем файл
        const response = await axios({
            method: 'get',
            url: fullUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity;q=1, *;q=0',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Range': 'bytes=0-',
                'Referer': 'https://muzofond.fm/'
            },
            timeout: 60000 // 60 секунд таймаут
        });

        const writer = fs.createWriteStream(filepath);

        // Записываем файл
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

// Вспомогательная функция для декодинга HTML сущностей
function decodeHtml(str) {
    return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
             .replace(/&quot;/g, '"')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&nbsp;/g, ' ');
}
