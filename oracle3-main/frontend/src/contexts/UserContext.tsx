// src/contexts/UserContext.tsx
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { environment } from '@/config/environment';
import type { UserData } from '@/types/telegram';
import { userApi } from '@/api/userApi';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface UserContextType {
  username: string;
  userId: number;
  points: number;
  isLoading: boolean;
  error: Error | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { isDevEnvironment, initData } = useTelegramAuth();
  const mockUser = environment.getMockUser();
  
  const [userData, setUserData] = useState<UserData>(mockUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = async (userId: number): Promise<UserData> => {
    try {
      console.log('Fetching user data for userId:', userId);
      const response = await userApi.getUser(userId);
      console.log('API Response:', response);

      // In development, always maintain the mock user's ID
      if (isDevEnvironment) {
        return {
          id: mockUser.id, // Keep the mock user ID
          username: response.username,
          points: response.points
        };
      }

      return {
        id: Number(response.id),
        username: response.username,
        points: response.points
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    setIsLoading(true);
    try {
      // Always use mockUser.id in development
      const userId = isDevEnvironment ? mockUser.id : userData.id;
      const fetchedData = await fetchUserData(userId);
      console.log('Refreshed data:', fetchedData);
      
      setUserData(prevData => ({
        ...prevData,
        points: fetchedData.points
      }));
      setError(null);
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh user data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        let initialUserData: UserData;

        if (isDevEnvironment) {
          console.log('Development environment detected, using mock user');
          try {
            // Always use mockUser.id in development
            initialUserData = await fetchUserData(mockUser.id);
            console.log('Fetched mock user data:', initialUserData);
          } catch (error) {
            console.log('Falling back to mock data');
            initialUserData = mockUser;
          }
        } else if (initData?.user) {
          console.log('Production environment with Telegram user data');
          initialUserData = await fetchUserData(initData.user.id);
        } else {
          console.log('Using mock user as fallback');
          initialUserData = mockUser;
        }

        setUserData(initialUserData);
        setError(null);
      } catch (err) {
        console.error('Error initializing user:', err);
        if (isDevEnvironment) {
          console.log('Development environment: falling back to mock user');
          setUserData(mockUser);
          setError(null);
        } else {
          setError(err instanceof Error ? err : new Error('Failed to initialize user'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [isDevEnvironment, initData]);

  // Refresh points periodically
  useEffect(() => {
    if (!isLoading && !error) {
      const intervalId = setInterval(refreshUserData, 30000);
      return () => clearInterval(intervalId);
    }
  }, [isLoading, error]);

  const value = {
    username: userData.username,
    userId: userData.id,
    points: userData.points,
    isLoading,
    error,
    refreshUserData
  };

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };