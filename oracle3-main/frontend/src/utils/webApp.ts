import { TelegramWebApp } from '../types/telegram';
import { environment } from '../config/environment';

// Move interfaces to types/telegram.d.ts if not already there
interface UserData {
  id: number;
  username: string;
  points: number;
}

interface InitializationData extends UserData {
  auth_date: number;
  hash: string;
}

export class TelegramWebAppService {
  private static instance: TelegramWebAppService;
  private readonly isDev: boolean;
  private mockWebApp: TelegramWebApp | null = null;

  private constructor() {
    // Now we use the environment service to determine development mode
    this.isDev = environment.isLocalDevelopment();
    
    if (this.isDev) {
      // Get mock user data from environment configuration
      const mockUser = environment.getMockUser();
      this.setupMockWebApp(mockUser);
    }
  }

  public static getInstance(): TelegramWebAppService {
    if (!TelegramWebAppService.instance) {
      TelegramWebAppService.instance = new TelegramWebAppService();
    }
    return TelegramWebAppService.instance;
  }


  private setupMockWebApp(mockUser: UserData): void {
    const mockData = {
      ...mockUser,
      auth_date: Math.floor(Date.now() / 1000),
      hash: this.generateMockHash()
    };
    
    // Store event handlers for our mock implementation
    const eventHandlers: Map<string, Set<() => void>> = new Map();

    const stringifiedData = {
      id: mockData.id.toString(),
      username: mockData.username,
      points: mockData.points.toString(),
      auth_date: mockData.auth_date.toString(),
      hash: mockData.hash
    };
    
    this.mockWebApp = {
      // Basic properties remain the same
      initData: new URLSearchParams(stringifiedData).toString(),
      ready: () => console.log('Mock WebApp Ready'),
      expand: () => console.log('Mock WebApp Expand'),
      close: () => console.log('Mock WebApp Close'),

      // Theme properties
      colorScheme: 'light',
      themeParams: {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff'
      },

      // Viewport properties
      viewportHeight: window.innerHeight,
      viewportStableHeight: window.innerHeight,

      // Improved event handling methods
      onEvent: (eventType, eventHandler) => {
        // Get or create the set of handlers for this event type
        if (!eventHandlers.has(eventType)) {
          eventHandlers.set(eventType, new Set());
        }
        // Add the new handler to our set
        eventHandlers.get(eventType)?.add(eventHandler);
        console.log(`Mock: Added event listener for ${eventType}`);
      },

      offEvent: (eventType, eventHandler) => {
        // Remove the specific handler for this event type
        eventHandlers.get(eventType)?.delete(eventHandler);
        console.log(`Mock: Removed event listener for ${eventType}`);
      }
    };

    window.Telegram = {
      WebApp: this.mockWebApp
    };

    // Add helper method to trigger mock events (useful for testing)
    if (this.isDev) {
      (window.Telegram.WebApp as any).triggerEvent = (eventType: string) => {
        console.log(`Mock: Triggering ${eventType} event`);
        eventHandlers.get(eventType)?.forEach(handler => handler());
      };
    }
}

  // Rest of your methods remain the same
  private generateMockHash(): string {
    return `dev_hash_${Date.now()}`;
  }

  public getInitData(): string | null {
    const webApp = window.Telegram?.WebApp || this.mockWebApp;
    return webApp?.initData || null;
  }

  public isInTelegramWebApp(): boolean {
    return Boolean(window.Telegram?.WebApp || this.mockWebApp);
  }

  public isDevelopment(): boolean {
    return this.isDev;
  }

  public parseInitData(initData: string): InitializationData {
    const params = new URLSearchParams(initData);
    const parsed: Partial<InitializationData> = {};

    for (const [key, value] of params.entries()) {
      switch (key) {
        case 'id':
          parsed.id = parseInt(value);
          break;
        case 'username':
          parsed.username = value;
          break;
        case 'points':
          parsed.points = parseInt(value);
          break;
        case 'auth_date':
          parsed.auth_date = parseInt(value);
          break;
        case 'hash':
          parsed.hash = value;
          break;
      }
    }

    if (!this.isValidInitData(parsed)) {
      throw new Error('Invalid initialization data structure');
    }

    return parsed;
  }

  private isValidInitData(data: Partial<InitializationData>): data is InitializationData {
    return (
      typeof data.id === 'number' &&
      typeof data.username === 'string' &&
      typeof data.points === 'number' &&
      typeof data.auth_date === 'number' &&
      typeof data.hash === 'string'
    );
  }
}