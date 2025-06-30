import 'dotenv/config';
import { startBot, bot } from './src/bot/index.js';
import { initDB } from './src/services/db.js';
import { startScheduler } from './src/core/scheduler.js';

await initDB();
startBot();
startScheduler(bot);
