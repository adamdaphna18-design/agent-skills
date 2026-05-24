# 🤖 GOAT Crypto Agent – Telegram Bot

A Telegram bot that uses the **GOAT SDK** (Great Onchain Agent Toolkit) to interact with USDC on **Base Sepolia testnet**.

## Features (Phase 1)

- `/start` – Show wallet address and commands
- `/balance` – Check USDC balance
- `/transfer <amount> <address>` – Send USDC to any Ethereum address

## Prerequisites

- Node.js 20+ and `pnpm`
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- A wallet private key (for Base Sepolia testnet)
- A Base Sepolia RPC URL (free from [Alchemy](https://alchemy.com) or public endpoint)

## Setup

1. **Clone repository and enter directory**
   ```bash
   cd crypto-agent
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Configure environment
   ```bash
   cp .env.example .env
   # Edit .env with your keys
   ```

4. Run in development mode
   ```bash
   pnpm dev
   ```

5. Build and run production
   ```bash
   pnpm build
   pnpm start
   ```

Testnet Funds

· Get testnet ETH from Base Sepolia Faucet
· Get testnet USDC: swap ETH for USDC on Uniswap testnet

Troubleshooting

Problem Solution
Missing EVM_PRIVATE_KEY Check .env file exists and has all variables
Transfer fails with gas error Ensure wallet has at least 0.01 ETH on Base Sepolia
GOAT method not found The SDK is evolving – adapt tools.transfer call to the latest version

Next Steps (Phase 2)

· Add Phantom wallet integration
· Cross-chain swaps via deBridge MCP
· Open Wallet Standard (OWS) for key security
· x402 micropayments for agent-to-agent payments
· Natural language processing (LLM)

License

MIT