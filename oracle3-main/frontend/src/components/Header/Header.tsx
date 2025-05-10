// src/components/Header/Header.tsx
import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Coin from "@/assets/images/dollar-coin.svg";
import { Title } from "@telegram-apps/telegram-ui";
import { AnimatedCounter } from 'react-animated-counter';
import { useNavigate } from 'react-router-dom';
import Yik from "@/assets/images/yik-green.svg";
import SoundOffIcon from "@/assets/images/sound-off.svg";
import SoundOnIcon from "@/assets/images/sound-on.svg";
import { AudioContext } from '@/components/App';
import { useUser } from '@/contexts/UserContext';

export interface HeaderProps {
  charmBalance?: number;
}

export const Header = ({ charmBalance = 0 }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { play, setPlay } = useContext(AudioContext);
  const navigate = useNavigate();
  const { username, points } = useUser();

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleJackpotClick = () => {
    navigate('/jackpot');
    setIsDropdownOpen(false);
  };

  return (
    <div className='flex justify-between items-center p-4 border-b border-[#1F2428]'>
      <Link to="/chat">
        <img src={Yik} alt="Logo" className="h-8 cursor-pointer" />
      </Link>
      
      <div className='flex items-center relative'>
        <button onClick={() => setPlay(!play)} className="ml-4 mr-2">
          <img 
            src={play ? SoundOnIcon : SoundOffIcon} 
            alt={play ? 'Sound on' : 'Sound off'} 
            className='w-6' 
          />
        </button>

        {/* <Title className='text-4xl font-semibold text-white mb-2 ml-2'>
          <AnimatedCounter value={charmBalance} decimalPrecision={0} color="white" fontSize="40px" />
        </Title> */}

        <button onClick={handleToggleDropdown} className="ml-4">
          <img src={Coin} alt="Dropdown Icon" className="h-6" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-4 w-48 shadow-lg rounded-md z-50">
            <div className="p-4 space-y-3 bg-[#1A1D21] border border-[#1C2532] rounded-md">
              <p className="text-lg font-normal text-[#54B052]">
                Hey, {username}
              </p>
              <p className="text-lg font-normal text-[#54B052]">
                Your Points: {points}
              </p>
              <p className="text-lg font-normal text-[#54B052]">
                Your $DB Tokens: {charmBalance}
              </p>
              
              {/* <Link 
                to="/convert" 
                className="block w-full mt-2"
                onClick={() => setIsDropdownOpen(false)}
              >
                <button className="w-full py-2 px-4 rounded bg-[#121317] border border-[#1C2532] text-[#54B052] transition-colors hover:bg-[#1C2532] uppercase">
                  Convert
                </button>
              </Link> */}
              
              <button 
                onClick={handleJackpotClick}
                className="w-full py-2 px-4 rounded bg-[#121317] border border-[#1C2532] text-[#54B052] transition-colors hover:bg-[#1C2532] uppercase"
              >
                Go to Jackpot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};