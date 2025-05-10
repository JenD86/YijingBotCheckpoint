// src/components/App.tsx
import { type FC, useEffect, useRef, useState, createContext } from "react";
import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom";
import { routes } from "@/navigation/routes.tsx";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTheme } from "@/hooks/useTelegramTheme";
import { DevelopmentBanner } from "./DevelopmentBanner";
import { AppRoot } from "@telegram-apps/telegram-ui";
import { UserProvider } from '@/contexts/UserContext';

// Audio context definition
interface AudioContextType {
  play: boolean;
  setPlay: (play: boolean) => void;
}

export const AudioContext = createContext<AudioContextType>({
  play: false,
  setPlay: () => {},
});

const AuthenticatedContent: FC = () => {
  const [play, setPlay] = useState(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const soundURL = new URL("/sounds/background.mp3", import.meta.url);

  useEffect(() => {
    const sound = new Audio(soundURL.href);
    sound.loop = true;
    sound.volume = 0.6;
    sound.preload = "auto";
    soundRef.current = sound;

    sound.addEventListener('canplaythrough', () => {
      console.log('Audio ready to play');
    });

    sound.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!soundRef.current) return;
    
    if (play) {
      const playPromise = soundRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error);
          setPlay(false);
        });
      }
    } else {
      soundRef.current.pause();
    }
  }, [play]);

  return (
    <AudioContext.Provider value={{ play, setPlay }}>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            {routes.map((route) => (
              <Route 
                key={route.path} 
                path={route.path} 
                element={<route.Component />}
              />
            ))}
            <Route path='*' element={<Navigate to='/' />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </AudioContext.Provider>
  );
};

// Loading and error components remain the same
const LoadingScreen: FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg">Loading...</p>
  </div>
);

const ErrorScreen: FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <p className="text-lg text-red-600">Error: {error.message}</p>
      <p className="text-sm text-gray-600">Please open this app through Telegram</p>
    </div>
  </div>
);

export const App: FC = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    initData,
    isDevEnvironment 
  } = useTelegramAuth();

  useTelegramTheme();

  return (
    <AppRoot>
      <div className="w-full min-h-screen">
        <DevelopmentBanner isDev={isDevEnvironment} initData={initData} />
        
        <div className={`${isDevEnvironment ? 'pt-12' : ''}`}>
          {isLoading ? (
            <LoadingScreen />
          ) : error ? (
            <ErrorScreen error={error} />
          ) : isAuthenticated && initData ? (
            <AuthenticatedContent />
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <p className="text-lg">Please open this app through Telegram</p>
            </div>
          )}
        </div>
      </div>
    </AppRoot>
  );
};