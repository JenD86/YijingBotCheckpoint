export default () => ({
  // ... existing config
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    botUsername: process.env.TELEGRAM_BOT_USERNAME,
  },
  payments: {
    defaultAmount: process.env.DEFAULT_PAYMENT_AMOUNT || 200, // in Stars
    cryptoAmount: process.env.CRYPTO_PAYMENT_AMOUNT || '0.1', // in ETH/tokens
  }
});
