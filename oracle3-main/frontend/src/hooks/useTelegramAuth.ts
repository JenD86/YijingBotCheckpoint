import { useState, useEffect } from 'react';
import { verifyTelegramAuth } from '../api/auth';
import { TelegramWebAppService } from '../utils/webApp';
import { InitializationData } from '../types/telegram';


interface UseTelegramAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  initData: InitializationData | null;
  isDevEnvironment: boolean;
}

export const useTelegramAuth = (): UseTelegramAuthResult => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initData, setInitData] = useState<InitializationData | null>(null);
  
  const telegramService = TelegramWebAppService.getInstance();
  const isDevEnvironment = telegramService.isDevelopment();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        if (!telegramService.isInTelegramWebApp()) {
          throw new Error('Not in Telegram WebApp environment');
        }

        const rawInitData = telegramService.getInitData();
        
        if (!rawInitData) {
          throw new Error('No Telegram WebApp initData found');
        }

        // Skip backend verification in development
        const isValid = isDevEnvironment || await verifyTelegramAuth(rawInitData);
        
        if (isValid) {
          const parsedData = telegramService.parseInitData(rawInitData);
          setInitData(parsedData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Authentication failed'));
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [isDevEnvironment]);

  return { 
    isAuthenticated, 
    isLoading, 
    error, 
    initData,
    isDevEnvironment 
  };}