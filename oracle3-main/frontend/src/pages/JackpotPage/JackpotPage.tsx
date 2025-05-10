import React, { useEffect, useState } from 'react';
import { Button, FixedLayout, Text } from "@telegram-apps/telegram-ui";
import { useNavigate } from 'react-router-dom';

const JackpotPage = () => {
  const navigate = useNavigate();
  const [isWinner, setIsWinner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketNumber, setTicketNumber] = useState('');
  const [dailyPool, setDailyPool] = useState(0);

  useEffect(() => {
    const checkIfWinner = async () => {
      // Logic to check if the user is a winner
      // This should be replaced with your actual logic to check the lottery ticket
      const result = await fetch('/api/check-winner'); // Example API call
      if (result.isWinner) {
        setIsWinner(true);
        setTicketNumber(result.ticketNumber); // Assuming the API returns the ticket number
        setDailyPool(result.dailyPool); // Assuming the API returns the daily pool amount
      }
      setLoading(false);
    };

    checkIfWinner();
  }, []);

  const handleClaim = async () => {
    // Logic to connect wallet and pay gas to claim the win
    // This should be replaced with your actual wallet integration
    alert('Claiming your win...');
    navigate('/profile'); // Redirect after claiming
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <FixedLayout
      className='flex justify-center items-center w-full h-full bg-cover bg-center'
      style={{ backgroundColor: '#121317' }}
    >
      {loading ? (
        <Text>Loading...</Text>
      ) : isWinner ? (
        <div className="text-center">
          <h1 className="text-5xl font-bold text-green-500">Fortune has smiled upon you!</h1>
          <Text className="text-xl">
            Your lot "{ticketNumber}" was favored by the gods, earning you {dailyPool} $DB.
          </Text>
          <div className="mt-4">
            <Button 
              onClick={handleClaim} 
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent"
              style={{
                backgroundColor: '#121317',
                stroke: '1px solid #030712',
                border: '1px solid #1C2532',
              }}
            >
              Claim Your Prize
            </Button>
            <Button 
              onClick={handleBack} 
              className="mt-2 inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent"
              style={{
                backgroundColor: '#121317',
                stroke: '1px solid #030712',
                border: '1px solid #1C2532',
              }}
            >
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Text className="text-xl">Sorry, you did not win today. Better luck next time!</Text>
          <div className="mt-4">
            <Button 
              onClick={handleBack} 
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent"
              style={{
                backgroundColor: '#121317',
                stroke: '1px solid #030712',
                border: '1px solid #1C2532',
              }}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </FixedLayout>
  );
};

export default JackpotPage; 