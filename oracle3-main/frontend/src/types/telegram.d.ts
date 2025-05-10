// src/types/telegram.d.ts

// Expanding the TelegramWebApp interface while keeping existing properties
export interface TelegramWebApp {
  // Your existing properties
  initData: string;
  ready: () => void;
  expand: () => void;
  close: () => void;

  // Adding theme-related properties
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
  };

  // Adding viewport properties
  viewportHeight: number;
  viewportStableHeight: number;

  // Adding event handling methods
  onEvent: <T extends TelegramWebAppEvent>(eventType: T, eventHandler: () => void) => void;
  offEvent: <T extends TelegramWebAppEvent>(eventType: T, eventHandler: () => void) => void;
}

// Your existing user data interfaces remain unchanged
export interface UserData {
  id: number;
  username: string;
  points: number;
}

export interface InitializationData extends UserData {
  auth_date: number;
  hash: string;
}

// Adding new type for Telegram events
export type TelegramWebAppEvent =
  | 'themeChanged'
  | 'viewportChanged'
  | 'mainButtonClicked'
  | 'backButtonClicked'
  | 'settingsButtonClicked'
  | 'invoiceClosed'
  | 'popupClosed'
  | 'qrTextReceived'
  | 'clipboardTextReceived';

// Your existing global declaration
declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Keep the empty export
export {};