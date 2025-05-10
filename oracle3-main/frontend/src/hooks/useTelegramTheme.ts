import { useEffect } from 'react';
import { TelegramWebAppEvent } from '../types/telegram';

export const useTelegramTheme = () => {
  useEffect(() => {
    // First, get a reference to the WebApp to ensure type safety
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      console.log('Telegram WebApp is not available');
      return;
    }

    // Define handlers for all possible Telegram events
    // This ensures we meet the Record<TelegramWebAppEvent, () => void> type requirement
    const handlers: Record<TelegramWebAppEvent, () => void> = {
      // Theme and viewport handlers for UI adaptation
      themeChanged: () => {
        const colorScheme = webApp.colorScheme;
        const themeParams = webApp.themeParams;
        console.log('Theme changed to:', colorScheme);
        document.documentElement.setAttribute('data-theme', colorScheme);
      },
      
      viewportChanged: () => {
        const viewportHeight = webApp.viewportHeight;
        const stableHeight = webApp.viewportStableHeight;
        console.log('Viewport changed:', { height: viewportHeight, stableHeight });
        document.documentElement.style.setProperty('--tg-viewport-height', `${viewportHeight}px`);
      },

      // Navigation and interaction handlers
      mainButtonClicked: () => {
        console.log('Main button clicked');
      },
      
      backButtonClicked: () => {
        console.log('Back button clicked');
        // You might want to handle navigation here
        // history.back();
      },
      
      settingsButtonClicked: () => {
        console.log('Settings button clicked');
        // You could open your app's settings interface here
      },

      // Modal and popup handlers
      invoiceClosed: () => {
        console.log('Invoice closed');
        // Handle post-payment or cancellation logic
      },
      
      popupClosed: () => {
        console.log('Popup closed');
        // Handle any cleanup after popup closes
      },

      // Data reception handlers
      qrTextReceived: () => {
        console.log('QR text received');
        // Handle QR code scanning results
      },
      
      clipboardTextReceived: () => {
        console.log('Clipboard text received');
        // Handle clipboard data
      }
    };

    // Register all event handlers with proper type safety
    Object.entries(handlers).forEach(([event, handler]) => {
      webApp.onEvent(event as TelegramWebAppEvent, handler);
    });

    // Cleanup function ensures all handlers are properly removed
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        webApp.offEvent(event as TelegramWebAppEvent, handler);
      });
    };
  }, []);
};