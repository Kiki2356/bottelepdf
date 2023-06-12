const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const pdf = require('pdf-parse');
const natural = require('natural');

const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken, { polling: true });

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

bot.onText(/\/pdf/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Silakan kirim file PDF untuk disederhanakan teksnya.');
});

bot.onText(/\/text/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Silakan kirim teks untuk disederhanakan.');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.document) {
    const filePath = `./input.pdf`;

    const file = fs.createWriteStream(filePath);
    file.on('close', () => {
      extractTextFromPDF(filePath)
        .then((text) => summarizeText(text))
        .then((summary) => bot.sendMessage(chatId, summary))
        .catch((error) => {
          console.error(error);
          bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
        });
    });
  } else {
    summarizeText(msg.text)
      .then((summary) => bot.sendMessage(chatId, summary))
      .catch((error) => {
        console.error(error);
        bot.sendMessage(chatId, 'Terjadi kesalahan saat menyederhanakan teks.');
      });
  }
});

function extractTextFromPDF(filePath) {
  return pdf(fs.readFileSync(filePath)).then((data) => data.text);
}

function summarizeText(text) {
  const tokens = tokenizer.tokenize(text);
  const stemmedTokens = tokens.map((token) => stemmer.stem(token));
  return Promise.resolve(stemmedTokens.join(' '));
}

console.log('Bot is running...');
