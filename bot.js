const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { PDFExtract } = require('pdf.js-extract');

// Mengambil token bot dari environment variable
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

// Fungsi untuk menangani perintah /pdf
bot.onText(/\/pdf/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Silakan kirim file PDF untuk disederhanakan teksnya.');
});

// Fungsi untuk menangani perintah /text
bot.onText(/\/text/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Silakan kirim teks untuk disederhanakan.');
});

// Fungsi untuk menangani pesan yang diterima
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Cek jika pesan berisi file PDF
  if (msg.document && msg.document.mime_type === 'application/pdf') {
    const fileId = msg.document.file_id;
    const filePath = `./${fileId}.pdf`;

    bot.downloadFile(fileId, filePath)
      .then(() => {
        extractTextFromPDF(filePath)
          .then((text) => {
            summarizeText(text)
              .then((summary) => {
                bot.sendMessage(chatId, summary);
              })
              .catch(() => {
                bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
              });
          })
          .catch(() => {
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengekstraksi teks dari PDF.');
          });
      })
      .catch(() => {
        bot.sendMessage(chatId, 'Terjadi kesalahan saat mengunduh file PDF.');
      });
  } else {
    const text = msg.text;
    summarizeText(text)
      .then((summary) => {
        bot.sendMessage(chatId, summary);
      })
      .catch(() => {
        bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
      });
  }
});

function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const pdfExtract = new PDFExtract();
    pdfExtract.extract(filePath, {}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const pages = data.pages.map((page) => page.content);
        const text = pages.join(' ');
        resolve(text);
      }
    });
  });
}

function summarizeText(text) {
  return new Promise((resolve) => {
    // Implementasikan algoritma penyederhanaan teks sesuai kebutuhan
    // Contoh: Mengambil 100 karakter pertama
    const summary = text.substring(0, 100);
    resolve(summary);
  });
}

console.log('Bot is running...');
