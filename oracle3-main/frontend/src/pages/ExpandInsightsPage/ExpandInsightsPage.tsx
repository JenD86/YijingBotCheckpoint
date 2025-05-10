// src/pages/ExpandInsightsPage/ExpandInsightsPage.tsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@telegram-apps/telegram-ui";
import { Header } from "@/components/Header/Header";
import { ichingApi } from '@/api/ichingApi';
import { useUser } from '@/contexts/UserContext';

// Set to 0 for development, change to 10 for production
const DB_COST = 0;

interface LocationState {
  originalResponse: string;
  hexagramId: string;
  points: number;
  question: string;
}

const ExpandInsightsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const state = location.state as LocationState;

  const handleBack = () => {
    navigate(-1);
  };

  /* Payment wall integration will go here
  const processPayment = async (amount: number) => {
    // This will be replaced with actual crypto payment processing
    return true;
  };
  */

  const handleExpand = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // In the future, process payment here
      // const paymentSuccess = await processPayment(DB_COST);
      
      // Get expanded reading
      const expandedResponse = await ichingApi.getExpandedReading(
        userId,
        state.hexagramId
      );

      // The expanded response will include both the detailed reading
      // and the lottery ticket information from the backend
      navigate('/expanded-results', {
        state: {
          response: expandedResponse.detailedReading,
          lotteryTicket: expandedResponse.lotteryTicket.ticketId,
          drawDate: expandedResponse.lotteryTicket.drawDate,
          question: state.question
        }
      });
    } catch (err) {
      console.error('Error expanding reading:', err);
      setError('Failed to get expanded reading. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen text-green-500 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <h2 className="text-center text-xl mb-6">
            Burn ${DB_COST} DB to unlock deeper insights into your reading
          </h2>
          
          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}

          <div className="flex space-x-14 p-10">
            <Button
              onClick={handleExpand}
              disabled={isProcessing}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
              style={{
                backgroundColor: '#121317',
                border: '1px solid #1C2532',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#1C2532';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#121317';
                }
              }}
            >
              {isProcessing ? 'Processing...' : (DB_COST === 0 ? 'Get Expanded Reading' : `Pay ${DB_COST} DB`)}
            </Button>
            
            <Button
              onClick={handleBack}
              disabled={isProcessing}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
              style={{
                backgroundColor: '#121317',
                border: '1px solid #1C2532',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#1C2532';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#121317';
                }
              }}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandInsightsPage;