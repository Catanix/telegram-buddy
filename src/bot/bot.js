import { Telegraf } from 'telegraf';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { setActualCommandList } from '../utils/commandList.js';
import { textHandler } from './handlers/textHandler.js';
import { statsHandler } from './handlers/commands/statsHandler.js';
import { musicSearchHandler } from './handlers/commands/musicSearchHandler.js';
import { unzipHandler, summaryHandler } from './handlers/commands/groupCommands.js';
import { initGroupHandlers } from './handlers/actions/init.js';
import { getDatabase } from '../services/database/index.js';
import * as groupPermissions from '../services/groupPermissions.js';

/**
 * Initialize and configure the bot
 * @returns {Telegraf} Configured bot instance
 */
export function createBot() {
    const bot = new Telegraf(CONFIG.token);

    // Error handling
    bot.catch((err, ctx) => {
        logger.error(`Bot error:`, err);
        try { ctx.reply('Произошла ошибка.'); } catch {}
    });

    // ===== STEP 1: Save group messages (FIRST, before everything) =====
    bot.on('message', async (ctx, next) => {
        if (ctx.message?.text && (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup')) {
            try {
                const { saveGroupMessage } = await import('../services/database/messages.js');
                await saveGroupMessage(
                    ctx.chat.id, ctx.message.message_id, ctx.from.id,
                    ctx.from.username, ctx.from.first_name, ctx.message.text
                );
            } catch (err) {
                logger.error('Save message error:', err);
            }
        }
        return next();
    });

    // ===== STEP 2: Log all messages =====
    bot.use((ctx, next) => {
        const text = ctx.message?.text || ctx.callbackQuery?.data || '[no text]';
        logger.info(`[MSG] ${ctx.chat?.type} ${ctx.chat?.id} @${ctx.from?.username}: ${text.substring(0, 40)}`);
        return next();
    });

    // ===== STEP 3: Access control =====
    bot.use(async (ctx, next) => {
        const chatType = ctx.chat?.type;
        const username = ctx.from?.username;
        const chatId = ctx.chat?.id;

        // Private chats - admin only
        if (chatType === 'private') {
            if (username !== CONFIG.adminUsername) {
                return ctx.reply('❌ Нет доступа.');
            }
            return next(); // Admin allowed, continue to handlers
        }

        // Groups - check permissions
        if (chatType === 'group' || chatType === 'supergroup') {
            const isAllowed = await groupPermissions.isGroupAllowed(String(chatId));
            if (!isAllowed) {
                // Request access
                await groupPermissions.requestGroupAccess(String(chatId), ctx.chat.title, username);
                // Notify admin
                try {
                    await ctx.telegram.sendMessage(CONFIG.adminChatId,
                        `📢 Новая группа!\n${ctx.chat.title}\nID: ${chatId}`,
                        { reply_markup: { inline_keyboard: [[
                            { text: '✅ Разрешить', callback_data: `allow_group_${chatId}` },
                            { text: '❌ Отклонить', callback_data: `deny_group_${chatId}` }
                        ]]}}
                    );
                } catch (e) {}
                try { await ctx.reply('👋 Ожидайте разрешения.'); } catch {}
            }
            return next();
        }

        return next();
    });

    // ===== STEP 4: Commands =====
    setActualCommandList(bot);
    bot.command(['start', 'start@catanix_home_bot'], (ctx) => {
        const isGroup = ctx.chat.type !== 'private';
        if (isGroup) {
            return ctx.reply('👋 Привет!\n/unzip - скачать по ссылке\n/summary - саммаризация');
        }
        return ctx.reply('👋 Привет! Отправь ссылку на TikTok, Instagram, YouTube или X');
    });
    bot.command(['stats', 'stats@catanix_home_bot'], statsHandler);
    bot.command(['music', 'music@catanix_home_bot'], musicSearchHandler);
    bot.command(['unzip', 'unzip@catanix_home_bot'], unzipHandler);
    bot.command(['summary', 'summary@catanix_home_bot'], summaryHandler);

    // ===== STEP 5: Group handlers (my_chat_member, etc.) =====
    initGroupHandlers(bot);

    // ===== STEP 6: Text handler for auto-download (private only) =====
    bot.on('text', textHandler);

    return bot;
}

export async function startBot(bot) {
    const me = await bot.telegram.getMe();
    logger.info(`Bot @${me.username} starting...`);
    await bot.launch();
    logger.info('Bot running');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
