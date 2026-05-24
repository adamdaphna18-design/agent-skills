import { getTools } from "@goat-sdk/core";
import { viem } from "@goat-sdk/wallet-viem";
import { erc20 } from "@goat-sdk/plugin-erc20";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.EVM_PRIVATE_KEY || !process.env.EVM_PROVIDER_URL) {
  throw new Error("Missing EVM_PRIVATE_KEY or EVM_PROVIDER_URL in .env");
}

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.EVM_PROVIDER_URL),
});

const USDC_SEPOLIA_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// The tools object returned by getTools
export const tools = await getTools({
  wallet: viem(walletClient),
  plugins: [
    erc20({
      tokens: [
        {
          name: "USDC",
          symbol: "USDC",
          decimals: 6,
          chains: {
            [baseSepolia.id]: { contractAddress: USDC_SEPOLIA_ADDRESS },
          },
        },
      ],
    }),
  ],
});

export const walletAddress = account.address;

// Helper to call any tool using the generic execute method
export async function executeTool(toolName: string, params: Record<string, any>) {
  const tool = tools.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Tool ${toolName} not found`);
  return tool.execute(params);
}