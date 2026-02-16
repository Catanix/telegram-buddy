import 'dotenv/config';
import { startBot } from './src/bot/index.js';
import { initDB } from './src/services/db.js';

await initDB();
startBot();
