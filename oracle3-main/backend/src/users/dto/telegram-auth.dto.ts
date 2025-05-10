export class TelegramAuthDto {
    id: number;          // Telegram user ID
    username?: string;   // Optional username
    first_name?: string; // We might receive this but won't store it
    auth_date: number;   // Telegram auth date
    hash: string;        // Telegram hash for verification
  }