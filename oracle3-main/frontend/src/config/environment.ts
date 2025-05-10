interface EnvironmentConfig {
    isDevelopment: boolean;
    apiBaseUrl: string;
    telegram: {
      botToken?: string;
      mockUser: {
        id: number;
        username: string;
        points: number;
      };
    };
  }
  
  // This class manages our environment-specific configuration
  class Environment {
    private static instance: Environment;
    private config: EnvironmentConfig;
  
    private constructor() {
      // Initialize the configuration based on environment variables
      this.config = {
        isDevelopment: import.meta.env.DEV,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
        telegram: {
          botToken: import.meta.env.VITE_BOT_TOKEN,
          mockUser: {
            id: parseInt(import.meta.env.VITE_MOCK_USER_ID || '12345'),
            username: import.meta.env.VITE_MOCK_USERNAME || 'Unknown',
            points: 0
          }
        }
      };
  
      // Freeze the configuration to prevent runtime modifications
      Object.freeze(this.config);
    }
  
    public static getInstance(): Environment {
      if (!Environment.instance) {
        Environment.instance = new Environment();
      }
      return Environment.instance;
    }
  
    // Getter methods for accessing configuration
    public isDevelopment(): boolean {
      return this.config.isDevelopment;
    }
  
    public getApiBaseUrl(): string {
      return this.config.apiBaseUrl;
    }
  
    public getMockUser() {
      return this.config.telegram.mockUser;
    }
  
    public getBotToken(): string | undefined {
      return this.config.telegram.botToken;
    }
  
    // Development environment helpers
    public isLocalDevelopment(): boolean {
      return this.isDevelopment() && !window.Telegram?.WebApp;
    }
  
    public isTelegramDevelopment(): boolean {
      return this.isDevelopment() && !!window.Telegram?.WebApp;
    }
  
    // Validation method to ensure all required environment variables are present
    public validate(): void {
      if (this.isDevelopment()) {
        // Development environment validation
        if (this.isLocalDevelopment() && !this.config.telegram.mockUser) {
          console.warn('Mock user configuration is missing in development mode');
        }
      } else {
        // Production environment validation
        if (!this.config.apiBaseUrl) {
          throw new Error('API base URL is required in production mode');
        }
      }
    }
  }
  
  // Create type declarations for Vite's environment variables
  declare global {
    interface ImportMetaEnv {
      readonly VITE_API_BASE_URL: string;
      readonly VITE_BOT_TOKEN?: string;
      readonly VITE_MOCK_USER_ID: string;
      readonly VITE_MOCK_USERNAME: string;
    }
  }
  
  // Export a singleton instance
  export const environment = Environment.getInstance();
  