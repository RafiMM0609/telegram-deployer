import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { isAuthorized } from './utils/security.js';
import { setupHandlers } from './bot/handlers.js';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is not set in .env');
  process.exit(1);
}

if (!process.env.ALLOWED_CHAT_ID) {
  console.error('ERROR: ALLOWED_CHAT_ID is not set in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Global Middleware to block unauthorized users
bot.use(isAuthorized);

// Set up all bot commands and callbacks
setupHandlers(bot);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

// Start Bot
bot.launch().then(() => {
  console.log('🤖 TeleDeploy Bot is running!');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
