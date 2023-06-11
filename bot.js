const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const pdf = require('pdf-parse');
const { T5Tokenizer, T5ForConditionalGeneration } = require('t5-text-summary');

// Mengambil token bot dari environment variable
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

// Menginisialisasi tokenizer
const tokenizer = new T5Tokenizer();

// Menginisialisasi model pemrosesan bahasa
const summarizationModel = new T5ForConditionalGeneration();

// Fungsi untuk menangani pesan yang diterima
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Cek jika pesan berisi file PDF
  if (msg.document) {
    const fileLink = await bot.getFileLink(msg.document.file_id);
    const filePath = `./input.pdf`;

    const file = fs.createWriteStream(filePath);
    const response = await fetch(fileLink);
    response.body.pipe(file);
    file.on('close', () => {
      extractTextFromPDF(filePath)
        .then((text) => {
          summarizeText(text)
            .then((summary) => {
              bot.sendMessage(chatId, summary);
            })
            .catch((error) => {
              console.error(error);
              bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
            });
        })
        .catch((error) => {
          console.error(error);
          bot.sendMessage(chatId, 'Terjadi kesalahan saat mengekstraksi teks dari PDF.');
        });
    });
  } else {
    const text = msg.text;
    summarizeText(text)
      .then((summary) => {
        bot.sendMessage(chatId, summary);
      })
      .catch((error) => {
        console.error(error);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
      });
  }
});

function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const dataBuffer = fs.readFileSync(filePath);
    pdf(dataBuffer)
      .then((data) => {
        resolve(data.text);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function summarizeText(text) {
  return new Promise((resolve, reject) => {
    tokenizer
      .encode(text)
      .then((inputIds) => {
        summarizationModel
          .generate(inputIds)
          .then((summaryIds) => {
            const summary = tokenizer.decode(summaryIds);
            resolve(summary);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

console.log('Bot is running...');
