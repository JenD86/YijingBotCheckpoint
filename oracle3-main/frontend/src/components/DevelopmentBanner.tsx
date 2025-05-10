import { FC } from 'react';

interface DevelopmentBannerProps {
  isDev: boolean;
  initData?: any; // We'll show some debug info in dev mode
}

export const DevelopmentBanner: FC<DevelopmentBannerProps> = ({ isDev, initData }) => {
  if (!isDev) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-md text-sm font-medium">
              Development Mode
            </span>
            <span className="text-yellow-800 text-sm">
              {initData?.username ? `User: ${initData.username}` : 'No user data'}
            </span>
          </div>
          {/* Debug information button */}
          <button 
            onClick={() => console.log('Debug Info:', { initData })}
            className="text-yellow-800 text-sm hover:text-yellow-900 underline"
          >
            Show Debug Info
          </button>
        </div>
      </div>
    </div>
  );
};