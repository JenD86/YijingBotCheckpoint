import { Button, FixedLayout, Text } from "@telegram-apps/telegram-ui";
import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header/Header";

export const ProfilePage: FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <FixedLayout
        vertical='top'
        className='flex w-full flex-col h-full'
        style={{

        }}
      >
        <Header charmBalance={100} />
        <div className='flex flex-col items-center justify-center h-full space-y-12 md:space-y-10 px-4'>
          <h1 
            className="text-5xl font-bold text-center" 
            style={{ 
              fontFamily: 'Pixel Operator', 
              color: '#4DB24C',
              textShadow: '0 0 10px rgba(77, 178, 76, 0.5)'
            }}
          >
            Discover The Secret of Tomorrow
          </h1>
          
          <p 
            style={{ 
              color: '#FFFFFF', 
              marginTop: '10px', 
              fontSize: '1.5rem',
              textShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
            }}
          >
            where fates meet your desires and dreams come true
          </p>
          
          <div className='flex flex-col gap-4 w-full max-w-md'>
            <Button
              className="inline-flex items-center justify-center h-12 text-2xl py-8 px-8 rounded-lg transition-colors duration-300 hover:brightness-90"
              onClick={() => navigate("/chat")}
              style={{
                backgroundColor: '#121317',
                border: '1px solid #1C2532',
                boxShadow: '0 0 15px rgba(77, 178, 76, 0.3)'
              }}
            >
              <Text 
                className='my-auto mx-auto text-md' 
                style={{ color: '#4DB24C' }}
              >
                Tell My Fortune
              </Text>
            </Button>

          </div>
        </div>
      </FixedLayout>
    </div>
  );
};
