import { Button, FixedLayout, Text } from "@telegram-apps/telegram-ui";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import Yik from "@/components/NeonPulsingYik.tsx";
import { useContext } from "react";
import { AudioContext } from "@/components/App";

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const { setPlay } = useContext(AudioContext);

  const handleEnterClick = () => {
    setPlay(true);
    navigate("/profile");
  };

  return (
    <FixedLayout
      className='flex justify-end flex-col w-full h-full bg-cover bg-center bg-no-repeat border-t-[0.2rem] border-solid rounded-t-[3rem] border-green-500'
      vertical='top'
      style={{
        backgroundColor: '#121317',
      }}
    >
      <div
       className='flex flex-col justify-center items-center self-center px-[1rem] py-[2rem] w-11/12 gap-12'
       style={{}}
      > 
        <h1 className="text-5xl font-bold text-center" style={{ fontFamily: 'Pixel Operator', color: '#4DB24C' }}>
          Fortune Teller
        </h1>
        
        <Yik />
        <Button
          className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-2xl py-8 px-8 rounded-lg bg-card text-foreground font-bold uppercase transition-colors duration-300 hover:brightness-90 hover:text-accent"  
          style={{
            backgroundColor: '#121317',
            stroke: '1px solid #030712',
            border: '1px solid #1C2532',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1C2532';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#121317';
          }}
          onClick={handleEnterClick}
        >
          <Text className='my-auto mx-auto text-md' style={{ color: '#4DB24C' }}>Enter</Text>
          
        </Button>
      </div>
    </FixedLayout>
  );
};
