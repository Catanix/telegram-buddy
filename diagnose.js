import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Ловим ВСЕ события
bot.on('message', (ctx) => {
    console.log('[MESSAGE]', {
        chat_type: ctx.chat?.type,
        chat_id: ctx.chat?.id,
        chat_title: ctx.chat?.title,
        from: ctx.from?.username,
        text: ctx.message?.text?.substring(0, 50),
        msg_type: ctx.message?.content_type || 'unknown'
    });
});

bot.on('my_chat_member', (ctx) => {
    console.log('[MY_CHAT_MEMBER]', {
        chat: ctx.chat?.title,
        old_status: ctx.myChatMember?.old_chat_member?.status,
        new_status: ctx.myChatMember?.new_chat_member?.status
    });
});

bot.on('new_chat_members', (ctx) => {
    console.log('[NEW_CHAT_MEMBERS]', {
        chat: ctx.chat?.title,
        members: ctx.message?.new_chat_members?.map(m => m.username)
    });
});

bot.catch((err) => {
    console.error('[ERROR]', err.message);
});

bot.launch();
console.log('Diagnostic bot started. Send messages to see what Telegram sends...');

// Exit after 30 seconds
setTimeout(() => {
    console.log('Exiting...');
    process.exit(0);
}, 30000);
