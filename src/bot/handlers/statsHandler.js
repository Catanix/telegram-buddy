import fs from 'fs';
import path from 'path';
import { getStats } from '../../services/db.js';

export async function statsHandler(ctx) {
    try {
        const userId = ctx.from.id;
        const stats = await getStats(userId);

        let message = '📊 *Ваша статистика использования сервисов:*\n\n';

        if (stats.length === 0) {
            message += 'Вы еще не использовали никакие сервисы.';
        } else {
            const serviceMap = {
                'task': '✅ Задачи',
                'youtube': '▶️ YouTube',
                'instagram': '📸 Instagram',
                'tiktok': '🎵 TikTok',
            };

            stats.forEach(stat => {
                const serviceName = serviceMap[stat.service] || stat.service;
                message += `${serviceName}: *${stat.usage_count}*\n`;
            });
        }

        const imagePath = path.resolve('src/assets/images/yukiStats.png');

        await ctx.replyWithPhoto(
            { source: fs.readFileSync(imagePath) },
            {
                caption: message,
                parse_mode: 'Markdown'
            }
        );

    } catch (error) {
        console.error('[StatsHandler Error]', error);
        await ctx.reply('❌ Произошла ошибка при получении статистики.');
    }
}
