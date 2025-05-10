import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@telegram-apps/telegram-ui";
import { Header } from "@/components/Header/Header";

interface LocationState {
  response: string;
  hexagramId: string;
  points: number;
  question: string;
}

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { response, hexagramId, points, question } = 
    (location.state as LocationState) || 
    { response: '', hexagramId: '', points: 0, question: '' };

  const handleBack = () => {
    navigate('/chat');
  };

  const handleExpandInsights = () => {
    navigate('/expand-insights', {
      state: { 
        originalResponse: response,
        hexagramId,
        points,
        question
      }
    });
  };

  return (
    <div className="min-h-screen text-green-500 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <h2 className="text-center font-light text-xl mb-6">
            I Ching Oracle's Response
          </h2>
          
          <div className="mb-4">
            <p className="text-lg mb-2">Your Question:</p>
            <p className="text-xl">{question}</p>
          </div>

          <div className="border-t border-green-500 pt-4 mb-4">
            <p className="text-lg mb-2">Oracle's Answer:</p>
            <p className="text-xl">{response}</p>
          </div>

          <div className="text-center mb-4 text-xl">
            Your points: {points}
          </div>

          <div className="flex space-x-14 p-10">
            <Button
              onClick={handleExpandInsights}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-8 text-xl py-6 px-2 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
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
              Expand Reading
            </Button>
            <Button
              onClick={handleBack}
              className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-8 text-xl py-6 px-2 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
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
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;