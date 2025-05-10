# Fortune Bot Platform

A decentralized platform combining Web3 gaming mechanics with Telegram integration, featuring smart contracts for token management and jackpot systems.

### User Experience Flow

```graph TD
    A[Site Entry] --> B[Navigation]
    B --> C[Ask Question]
    C --> D[Loading Animation]
    D --> E[Basic Result Part 1]
    E --> F[Basic Result Part 2]
    F --> G[Expand Option]
    G --> H[Points/Token Check]
    H --> I[Convert Points]
    I --> J[Payment]
    J --> K[Full Reading]
    K --> L[Lottery Entry]
    L --> M[Daily Drawing]
    M --> N[Winner Check]
```

## Project Structure

```
├── frontend/          # React/Vite frontend application
├── backend/           # NestJS backend server
└── evm-smart-contracts/  # Ethereum smart contracts
```

## Technology Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: NestJS + TypeScript
- **Smart Contracts**: Solidity + Hardhat
- **Blockchain Networks**: Base, Arbitrum
- **Integration**: Telegram Bot API

## Key Features

- Token Management System (Charms)
- Jackpot Gaming Mechanics
- Points Conversion System
- Tournament System
- Telegram Integration
- Web3 Wallet Integration

## Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn
- Hardhat for smart contract development
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies for each component:

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install

# Smart Contracts
cd evm-smart-contracts
npm install
```

### Development

1. Start the frontend development server:
```bash
cd frontend
npm run dev
```

2. Start the backend server:
```bash
cd backend
npm run start:dev
```

3. For smart contract development:
```bash
cd evm-smart-contracts
npx hardhat compile
npx hardhat test
```

### Environment Setup

Create `.env` files in each directory:

```env
# Frontend
VITE_API_URL=
VITE_SENTRY_DSN=

# Backend
DATABASE_URL=
JWT_SECRET=

# Smart Contracts
MAINNET_DEPLOYER=
TESTNET_DEPLOYER=
BASE_MAINNET_RPC=
BASE_TESTNET_RPC=
ARB_TESTNET_RPC=
ARB_API_KEY=
BASE_API_KEY=
```

## Testing

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
npm run test

# Smart Contracts
cd evm-smart-contracts
npx hardhat test
```

## Deployment

### Smart Contracts

1. Deploy contracts:
```bash
cd evm-smart-contracts
npx hardhat run scripts/deploy.ts --network [network]
```

2. Verify contracts:
```bash
npx hardhat run scripts/verify.ts --network [network]
```

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run build
npm run start:prod
```



## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Security

For security concerns, please email [security contact].

## Support

For support, join our [Telegram channel/Discord server].
```
