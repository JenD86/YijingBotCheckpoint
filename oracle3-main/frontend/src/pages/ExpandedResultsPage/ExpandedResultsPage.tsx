import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@telegram-apps/telegram-ui";
import { Header } from "@/components/Header/Header";

interface LocationState {
  response: string;
  lotteryTicket: string;
  drawDate: string;
  question: string;
}

const ExpandedResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { response, lotteryTicket, drawDate, question } = 
    (location.state as LocationState) || { 
      response: '', 
      lotteryTicket: null,
      drawDate: null,
      question: ''
    };

  const handleBack = () => {
    navigate('/chat');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen text-green-500 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl mb-2">Your Question:</h2>
            <p className="text-xl italic">{question}</p>
          </div>

          <div className="border-t border-green-500 pt-4">
            <h2 className="font-bold text-2xl mb-4">Expanded Insights:</h2>
            <div className="text-lg mb-8 whitespace-pre-line">
              {response}
            </div>
          </div>

          {lotteryTicket && (
            <div className="bg-[#121317] border border-green-500 rounded-lg p-6 mb-6">
              <h3 className="text-2xl mb-3 text-center">🎟️ Lottery Ticket</h3>
              <div className="text-center">
                <p className="text-3xl font-mono mb-2">{lotteryTicket}</p>
                <p className="text-sm opacity-80">
                  Draw Date: {formatDate(drawDate)}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleBack}
            className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
            style={{
              backgroundColor: '#121317',
              border: '1px solid #1C2532',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1C2532';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#121317';
            }}
          >
            Ask Another Question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpandedResultsPage;