import { 
  getMainMenuKeyboard, 
  getAppListKeyboard, 
  getDeployConfirmKeyboard, 
  getConfigMenuKeyboard, 
  getRemoveAppKeyboard,
  getCancelAddAppKeyboard
} from './keyboards.js';
import { getConfig, addApp, removeApp } from '../services/config.js';
import { runDeploy } from '../services/deploy.js';
import { validateAppRegistration } from '../utils/security.js';

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Simple in-memory state management for adding an app.
// Key: chatId, Value: 'adding_app' | null
const userStates = new Map();

export const setupHandlers = (bot) => {
  // Main Menu Command
  bot.command(['start', 'menu'], async (ctx) => {
    userStates.delete(ctx.chat.id); // clear state
    await ctx.reply(
      '🤖 Selamat datang di TeleDeploy Bot!\n\nSilakan pilih menu di bawah ini:', 
      getMainMenuKeyboard()
    );
  });

  // Main Menu Callback
  bot.action('main_menu', async (ctx) => {
    userStates.delete(ctx.chat.id);
    await ctx.editMessageText(
      '🤖 Menu Utama TeleDeploy Bot:\n\nSilakan pilih menu:',
      getMainMenuKeyboard()
    );
  });

  // --- Workflow A: Deployment ---

  bot.action('deploy_menu', async (ctx) => {
    userStates.delete(ctx.chat.id);
    const apps = await getConfig();
    if (apps.length === 0) {
      await ctx.editMessageText(
        'Belum ada aplikasi yang dikonfigurasi. Silakan masuk ke menu Pengaturan Konfigurasi.',
        getConfigMenuKeyboard()
      );
      return;
    }
    
    await ctx.editMessageText(
      '🚀 Pilih aplikasi yang ingin di-deploy:',
      getAppListKeyboard(apps)
    );
  });

  // Dynamic handler for deployment confirmation
  bot.action(/^deploy_confirm_(.+)$/, async (ctx) => {
    const appName = ctx.match[1];
    const safeAppName = escapeHTML(appName);
    await ctx.editMessageText(
      `⚠️ Anda yakin ingin menjalankan deployment untuk aplikasi: <b>${safeAppName}</b>?`,
      { parse_mode: 'HTML', ...getDeployConfirmKeyboard(appName) }
    );
  });

  // Dynamic handler for running deployment
  bot.action(/^deploy_run_(.+)$/, async (ctx) => {
    const appName = ctx.match[1];
    const apps = await getConfig();
    const app = apps.find((a) => a.name === appName);

    if (!app) {
      await ctx.editMessageText('Aplikasi tidak ditemukan dalam konfigurasi.');
      return;
    }

    const safeAppName = escapeHTML(appName);
    await ctx.editMessageText(`⏳ Sedang memproses deployment <b>${safeAppName}</b>... Mohon tunggu.`, { parse_mode: 'HTML' });

    const result = await runDeploy(app.directory);
    const safeOutput = escapeHTML(result.output);

    if (result.success) {
      await ctx.reply(`✅ Deployment <b>${safeAppName}</b> Berhasil!\n\n<pre><code>${safeOutput}</code></pre>`, { parse_mode: 'HTML' });
    } else {
      await ctx.reply(`❌ Deployment <b>${safeAppName}</b> Gagal!\n\n<pre><code>${safeOutput}</code></pre>`, { parse_mode: 'HTML' });
    }
  });

  // --- Workflow B: Configuration ---

  bot.action('config_menu', async (ctx) => {
    userStates.delete(ctx.chat.id);
    await ctx.editMessageText(
      '⚙️ Pengaturan Konfigurasi:\n\nPilih aksi yang ingin dilakukan:',
      getConfigMenuKeyboard()
    );
  });

  bot.action('config_view_all', async (ctx) => {
    const apps = await getConfig();
    if (apps.length === 0) {
      await ctx.reply('Belum ada aplikasi yang terdaftar.');
      return;
    }

    let msg = '📄 Daftar Konfigurasi Aplikasi:\n\n';
    apps.forEach((app, idx) => {
      msg += `${idx + 1}. <b>${escapeHTML(app.name)}</b>\n   Path: <code>${escapeHTML(app.directory)}</code>\n\n`;
    });

    await ctx.reply(msg, { parse_mode: 'HTML' });
  });

  bot.action('config_add_app', async (ctx) => {
    userStates.set(ctx.chat.id, 'adding_app');
    await ctx.editMessageText(
      '➕ <b>Tambah Aplikasi Baru</b>\n\nSilakan ketik nama aplikasi dan lokasi foldernya dengan format:\n\n<code>Nama_Aplikasi | /jalur/ke/folder</code>\n\nContoh: <code>backend-api | /home/user/apps/backend</code>',
      { parse_mode: 'HTML', ...getCancelAddAppKeyboard() }
    );
  });

  bot.action('config_remove_app_menu', async (ctx) => {
    const apps = await getConfig();
    if (apps.length === 0) {
      await ctx.editMessageText('Belum ada aplikasi untuk dihapus.', getConfigMenuKeyboard());
      return;
    }
    await ctx.editMessageText('❌ Pilih aplikasi yang ingin dihapus:', getRemoveAppKeyboard(apps));
  });

  bot.action(/^config_remove_run_(.+)$/, async (ctx) => {
    const appName = ctx.match[1];
    await removeApp(appName);
    const safeAppName = escapeHTML(appName);
    await ctx.editMessageText(`✅ Aplikasi <b>${safeAppName}</b> berhasil dihapus dari konfigurasi.`, { parse_mode: 'HTML' });
    
    // Automatically show config menu again
    setTimeout(async () => {
      try {
        await ctx.reply('⚙️ Pengaturan Konfigurasi:', getConfigMenuKeyboard());
      } catch(e) {}
    }, 1500);
  });

  // --- Message Handler for State (Adding App) ---
  
  bot.on('text', async (ctx) => {
    const state = userStates.get(ctx.chat.id);
    
    if (state === 'adding_app') {
      const input = ctx.message.text;
      const validation = await validateAppRegistration(input);

      if (!validation.valid) {
        await ctx.reply(`❌ Gagal: ${validation.message}\n\nSilakan coba lagi atau batalkan.`, getCancelAddAppKeyboard());
        return;
      }

      await addApp(validation.name, validation.directory);
      userStates.delete(ctx.chat.id);
      
      await ctx.reply(`✅ Aplikasi <b>${escapeHTML(validation.name)}</b> berhasil ditambahkan!\nPath: <code>${escapeHTML(validation.directory)}</code>`, { parse_mode: 'HTML' });
      await ctx.reply('⚙️ Kembali ke Pengaturan:', getConfigMenuKeyboard());
    } else {
      // If no state, perhaps guide them to menu
      await ctx.reply('Saya tidak mengerti. Ketik /menu untuk melihat pilihan yang ada.');
    }
  });
};
