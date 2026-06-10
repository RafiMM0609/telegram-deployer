import fs from 'fs/promises';

export const isAuthorized = (ctx, next) => {
  const allowedChatId = process.env.ALLOWED_CHAT_ID;
  const chatId = ctx.chat?.id?.toString();

  if (!chatId || chatId !== allowedChatId) {
    console.warn(`Unauthorized access attempt from Chat ID: ${chatId}`);
    // We ignore it silently as per requirements to not respond to strangers.
    return;
  }

  return next();
};

export async function validateAppRegistration(inputStr) {
  // Format: Name | /path/to/dir
  const parts = inputStr.split('|').map((s) => s.trim());
  
  if (parts.length !== 2) {
    return { valid: false, message: 'Format salah. Gunakan: Nama_Aplikasi | /jalur/ke/folder' };
  }

  const [name, directory] = parts;

  // Basic command injection characters block
  const dangerousChars = /[;&|`$\\]/;
  if (dangerousChars.test(name) || dangerousChars.test(directory)) {
    return { valid: false, message: 'Input mengandung karakter berbahaya yang dilarang.' };
  }

  try {
    const stat = await fs.stat(directory);
    if (!stat.isDirectory()) {
       return { valid: false, message: 'Path yang diberikan ada, tetapi bukan sebuah folder.' };
    }
  } catch (err) {
    return { valid: false, message: `Folder tidak ditemukan di server: ${directory}` };
  }

  return { valid: true, name, directory };
}
