const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const pdf = require('pdf-parse');
const natural = require('natural');

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
    // Proses ekstraksi fitur menggunakan algoritma TfIdf
    const tokenizer = new natural.WordTokenizer();
    const tfidf = new natural.TfIdf();
    const sentences = tokenizer.tokenize(text);
    sentences.forEach((sentence) => {
      tfidf.addDocument(sentence);
    });

    // Mengambil 3 kalimat dengan bobot tertinggi
    const summarySentences = [];
    tfidf.listTerms(0).slice(0, 3).forEach((term) => {
      const sentence = sentences[term.tfidf];
      summarySentences.push(sentence);
    });

    // Menggabungkan kalimat-kalimat menjadi ringkasan
    const summary = summarySentences.join(' ');

    resolve(summary);
  });
}

console.log('Bot is running...');
