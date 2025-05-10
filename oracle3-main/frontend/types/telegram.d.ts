export interface TelegramWebApp {
    initData: string;
    ready: () => void;
    expand: () => void;
    close: () => void;
    // Add other WebApp methods you might need
  }
  
  declare global {
    interface Window {
      Telegram?: {
        WebApp?: TelegramWebApp;
      };
    }
  }
  
  // This empty export makes this a module
  export {};