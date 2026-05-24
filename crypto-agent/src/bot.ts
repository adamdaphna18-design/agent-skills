import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { walletAddress, executeTool } from "./agent.js";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN missing in .env");
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    `🤖 **GOAT Crypto Agent**\n\n` +
    `My wallet: \`${walletAddress}\`\n\n` +
    `**Commands:**\n` +
    `/balance – Check USDC balance\n` +
    `/transfer <amount> <0x...> – Send USDC (e.g., /transfer 0.5 0x123...)\n\n` +
    `_Working on Base Sepolia testnet_`,
    { parse_mode: "Markdown" }
  );
});

bot.command("balance", async (ctx) => {
  try {
    const result = await executeTool("balanceOf", {
      token: "USDC",
      address: walletAddress,
    });
    const balance = result?.formatted || result?.value || "0";
    ctx.reply(`💰 Your USDC balance: **${balance}** USDC`, { parse_mode: "Markdown" });
  } catch (error: any) {
    console.error(error);
    ctx.reply(`❌ Balance check failed: ${error.message}`);
  }
});

bot.command("transfer", async (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length !== 3) {
    return ctx.reply(
      "Usage: `/transfer <amount> <recipient_address>`\n" +
      "Example: `/transfer 0.5 0x742d35Cc6634C0532925a3b844Bc9e7595f6b146`",
      { parse_mode: "Markdown" }
    );
  }

  const amount = parseFloat(args[1]);
  const to = args[2];

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Amount must be a positive number (e.g., 0.5 for 0.5 USDC).");
  }
  if (!to.startsWith("0x") || to.length !== 42) {
    return ctx.reply("❌ Invalid Ethereum address. Must start with 0x and be 42 characters long.");
  }

  try {
    ctx.reply(`⏳ Sending ${amount} USDC to ${to.slice(0, 6)}...${to.slice(-4)}...`);

    const amountBase = BigInt(Math.floor(amount * 10 ** 6));

    const result = await executeTool("transfer", {
      amount: amountBase,
      to: to,
      token: "USDC",
    });

    // Type-safe way to disable link preview: use `link_preview_options: { is_disabled: true }`
    ctx.reply(
      `✅ **Transfer successful!**\n\n` +
      `Amount: ${amount} USDC\n` +
      `To: \`${to}\`\n` +
      `Tx hash: \`${result?.hash || "check explorer"}\`\n\n` +
      `[View on Base Sepolia Explorer](https://sepolia.basescan.org/tx/${result?.hash})`,
      {
        parse_mode: "Markdown",
        link_preview_options: { is_disabled: true },
      }
    );
  } catch (error: any) {
    console.error(error);
    ctx.reply(
      `❌ Transfer failed: ${error.message || "Unknown error"}\n\n` +
      `Possible reasons:\n` +
      `• Insufficient USDC balance\n` +
      `• No ETH for gas (need ~0.01 ETH on Base Sepolia)\n` +
      `• Incorrect recipient address`
    );
  }
});

bot.launch()
  .then(() => console.log("🤖 Bot is running..."))
  .catch((err) => console.error("Failed to launch bot:", err));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));