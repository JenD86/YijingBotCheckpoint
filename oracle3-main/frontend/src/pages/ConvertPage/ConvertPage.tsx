import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@telegram-apps/telegram-ui";
import { Header } from "@/components/Header/Header";

const ConvertPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [points] = useState(1234); // This should come from your SQLite server
  const conversionRate = 0.1; // Example: 10 points = 1 $DB
  const estimatedDB = points * conversionRate;

  /* Production smart contract integration - uncomment when ready
  const convertPointsToDB = async () => {
    try {
      // 1. Verify points balance from SQLite
      const actualPoints = await fetchPointsBalance();
      
      // 2. Call smart contract for conversion
      const contract = await getConversionContract();
      const transaction = await contract.convertPoints(actualPoints);
      await transaction.wait();
      
      // 3. Clear points from SQLite after successful conversion
      await clearPointsBalance();
      
      return true;
    } catch (error) {
      console.error('Conversion error:', error);
      return false;
    }
  };
  */

  const handleConvert = async () => {
    setIsProcessing(true);
    try {
      // Development: Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      /* Uncomment for production
      const success = await convertPointsToDB();
      if (!success) {
        throw new Error('Conversion failed');
      }
      */

      alert(`Successfully converted ${points} points to ${estimatedDB} $DB!`);
      navigate('/profile');
    } catch (error) {
      console.error('Error during conversion:', error);
      alert('Error converting points. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen text-green-500 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <h2 className="text-left text-4xl mb-6">Convert Points to $DB</h2>
          
          <div className="border border-green-500 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span>Available Points:</span>
              <span className="text-2xl">{points}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Conversion Rate:</span>
              <span>{`${1/conversionRate} Points = 1 $DB`}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Estimated $DB:</span>
              <span className="text-2xl">{estimatedDB}</span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleConvert}
              disabled={isProcessing || points === 0}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
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
            >
              {isProcessing ? 'Converting...' : 'Convert Points to $DB'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertPage; 