import { WebApp } from '@telegram-apps/sdk-react';

interface PaymentSelectorProps {
  amount: number;
  onPaymentComplete: () => void;
}

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({ amount, onPaymentComplete }) => {
  const handleCryptoPayment = async () => {
    // Your existing crypto payment logic
  };

  const handleStarsPayment = async () => {
    try {
      const response = await fetch('/api/telegram/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      const { invoiceLink } = await response.json();
      
      WebApp.openInvoice(invoiceLink, (status) => {
        if (status === 'paid') {
          onPaymentComplete();
        }
      });
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <div className="payment-selector">
      <h3>Choose Payment Method</h3>
      <button onClick={handleCryptoPayment}>
        Pay with Crypto
      </button>
      <button onClick={handleStarsPayment}>
        Pay with Telegram Stars
      </button>
    </div>
  );
};
