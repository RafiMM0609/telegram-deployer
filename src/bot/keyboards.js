import { Markup } from 'telegraf';

export const getMainMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🚀 Mulai Deployment', 'deploy_menu')],
    [Markup.button.callback('⚙️ Pengaturan Konfigurasi', 'config_menu')]
  ]);
};

export const getAppListKeyboard = (apps) => {
  const buttons = apps.map((app) => [
    Markup.button.callback(`📱 ${app.name}`, `deploy_confirm_${app.name}`)
  ]);
  
  buttons.push([Markup.button.callback('↩️ Kembali ke Menu Utama', 'main_menu')]);
  return Markup.inlineKeyboard(buttons);
};

export const getDeployConfirmKeyboard = (appName) => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Ya, Jalankan Deployment', `deploy_run_${appName}`)],
    [Markup.button.callback('❌ Batalkan', 'deploy_menu')]
  ]);
};

export const getConfigMenuKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ Tambah Aplikasi Baru', 'config_add_app')],
    [Markup.button.callback('❌ Hapus Aplikasi', 'config_remove_app_menu')],
    [Markup.button.callback('📄 Lihat Semua Konfigurasi', 'config_view_all')],
    [Markup.button.callback('↩️ Kembali ke Menu Utama', 'main_menu')]
  ]);
};

export const getRemoveAppKeyboard = (apps) => {
  const buttons = apps.map((app) => [
    Markup.button.callback(`🗑️ Hapus ${app.name}`, `config_remove_run_${app.name}`)
  ]);
  
  buttons.push([Markup.button.callback('↩️ Kembali ke Pengaturan', 'config_menu')]);
  return Markup.inlineKeyboard(buttons);
};

export const getCancelAddAppKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❌ Batalkan Tambah Aplikasi', 'config_menu')]
  ]);
};
