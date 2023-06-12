const TelegramBot = require('node-telegram-bot-api');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const fetch = require('node-fetch');
const fs = require('fs');

// Mengambil token bot dari environment variable
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

// Fungsi untuk menyimpulkan teks dari file PDF
async function summarizePDF(filePath) {
  const pdfExtract = new PDFExtract();
  const options = {};
  const data = await pdfExtract.extract(filePath, options);
  const pages = data.pages;

  let summary = '';

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const content = page.content;

    for (let j = 0; j < content.length; j++) {
      const block = content[j];

      if (block.str) {
        summary += block.str + ' ';
      }
    }
  }

  return summary;
}

// Fungsi untuk menangani perintah /summarize
bot.onText(/\/summarize/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Silakan kirim file PDF untuk disimpulkan teksnya.');
});

// Fungsi untuk menangani pesan yang diterima
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;

  try {
    const fileLink = await bot.getFileLink(msg.document.file_id);
    const filePath = `./input.pdf`;

    // Unduh file PDF
    const response = await fetch(fileLink);
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);

    const summary = await summarizePDF(filePath);
    bot.sendMessage(chatId, summary);

    fs.unlinkSync(filePath); // Hapus file PDF setelah digunakan
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Terjadi kesalahan saat menyimpulkan teks dari file PDF.');
  }
});

// Listen on port 80
const port = process.env.PORT || 80;
bot.setWebHook(`https://api.telegram.org/bot5649401123:AAHTSgP6QUicvDKb91i719Klf_Kq-7sbOw0/setWebhook?url=https://different-ruby-cow.cyclic.app:80 `);
 