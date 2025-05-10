import { useState } from 'react';
import { Header } from "@/components/Header/Header";
import MatrixRainingLetters from "@/components/ProgressBar/MatrixRainingLetters";
import { Button } from "@telegram-apps/telegram-ui";
import { useNavigate } from 'react-router-dom';
import { ichingApi } from '@/api/ichingApi';
import { userApi } from '@/api/userApi';
import { useUser } from '@/contexts/UserContext';

const Divination = () => {
  const navigate = useNavigate();
  const { username, userId, refreshUserData } = useUser();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const suggestedQuestions = [
    'How do my dreams reflect my subconscious desires or fears?',
    'What message is my intuition trying to convey through my dreams?',
    'How can I let go of past regrets and focus on the present?'
  ];

  const handleQuestionSubmission = async (userQuestion: string) => {
    if (typeof userId !== 'number') {
      setError('Invalid user ID');
      return;
    }

    if (questionsAsked >= 8) {
      setError('Maximum questions limit reached');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get I Ching reading
      const ichingResponse = await ichingApi.askQuestion(userQuestion, userId);
      
      // Add random points
      const pointsResponse = await userApi.addRandomPoints(username);
      
      // Update user data in context
      await refreshUserData();
      
      // Clear any previous response and increment questions counter
      setResponse('');
      setQuestionsAsked(prev => prev + 1);
      
      // Navigate to results page with all necessary data
      navigate('/results', {
        state: { 
          response: ichingResponse.basicReading,
          hexagramId: ichingResponse.hexagramId,
          points: pointsResponse.points,
          question: userQuestion,
          totalQuestions: questionsAsked + 1,
          timestamp: ichingResponse.timestamp
        }
      });
    } catch (err) {
      console.error('Error in I Ching reading:', err);
      setError('Failed to get your reading. Please try again.');
      setResponse('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      handleQuestionSubmission(question);
    }
  };

  const handleSuggestedQuestion = (suggestedQ: string) => {
    setQuestion(suggestedQ);
    handleQuestionSubmission(suggestedQ);
  };

  return (
    <div className="min-h-screen text-green-500 flex flex-col">
      {loading && (
        <div className="fixed inset-0 z-50 bg-black">
          <MatrixRainingLetters 
            color="#4DB24C"
            keyProp="divination-loading"
            customClass="w-full h-full"
          />
        </div>
      )}

      <Header />

      <div className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center">
          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}

          {!response && !loading && (
            <div className="space-y-4 mb-8">
              <h2 className="text-center text-xl mb-6">
                Choose a question or ask your own: ({questionsAsked}/8)
              </h2>
              {suggestedQuestions.map((q, index) => (
                <Button
                  key={index}
                  onClick={() => handleSuggestedQuestion(q)}
                  disabled={questionsAsked >= 8}
                  className="inline-flex items-center justify-center whitespace-nowrap ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300 dark:text-green-500 border border-foreground hover:bg-muted dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-red-500 h-10 text-xl py-8 px-8 rounded-lg bg-card text-foreground transition-colors duration-300 hover:brightness-90 hover:text-accent w-full font-normal"
                  style={{
                    backgroundColor: '#030712',
                    border: '1px solid #1C2532',
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#1C2532';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = '#030712';
                    }
                  }}
                >
                  <span className="font-normal">{q}</span>
                </Button>
              ))}
            </div>
          )}

          {response && !loading && (
            <div className="border border-green-500 rounded p-4 mb-8">
              {response}
            </div>
          )}
        </div>

        <div className="sticky bottom-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-4">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="The 8-Bit Oracle awaits..."
                disabled={questionsAsked >= 8}
                className="w-full bg-[#121317] border border-green-500 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                type="submit" 
                disabled={!question.trim() || questionsAsked >= 8}
                className="bg-black border border-green-500 rounded px-6 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ➤
              </button>
            </div>
            {questionsAsked >= 8 && (
              <p className="text-red-500 text-sm mt-2">
                You've reached the maximum number of questions for today.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Divination;