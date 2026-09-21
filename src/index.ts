import { Bot, InputFile } from "grammy";
import { config } from "./config";
import { prisma } from "./db";
import fs from "fs";
import path from "path";
import { t } from "./texts";
import { handleStart, handleMyAccount, handleMyOrders, handleSupport, handleApproval, isApproved } from "./handlers/user";
import {
  handleStock,
  handleShop,
  handleCategorySelect,
  handleProductSelect,
  handleBuy,
  handleBackShop,
} from "./handlers/shop";
import {
  handleAdminPanel,
  handleAdminCallback,
  handleAdminMessage,
  handleAdminDocument,
  getAdminState,
  clearAdminState,
} from "./handlers/admin";

const bot = new Bot(config.botToken);

bot.command("start", handleStart);

bot.callbackQuery(/^(approve|reject)_\d+$/, handleApproval);

bot.use(async (ctx, next) => {
  if (!ctx.from) return;
  if (ctx.callbackQuery?.data?.startsWith("approve_") || ctx.callbackQuery?.data?.startsWith("reject_")) return;
  if (await isApproved(ctx)) {
    await next();
  } else {
    if (ctx.message?.text) {
      await ctx.reply(t.pendingApproval);
    } else if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "⏳ چاوەڕوان بە بۆ پەسەندکردن" });
    }
  }
});

// Clear admin state when navigating away (any non-admin callback or main menu)
bot.use(async (ctx, next) => {
  if (ctx.from && ctx.callbackQuery?.data) {
    const data = ctx.callbackQuery.data;
    const keepPrefixes = ["admin_delivery_", "admin_prod_cat_", "admin_stock_prod_"];
    const shouldKeep = keepPrefixes.some(p => data.startsWith(p));
    if (!shouldKeep && !data.startsWith("admin_")) {
      clearAdminState(ctx.from.id);
    }
  }
  if (ctx.from && ctx.message?.text?.startsWith("/")) {
    clearAdminState(ctx.from.id);
  }
  await next();
});

bot.callbackQuery("menu_shop", handleShop);
bot.callbackQuery("menu_stock", handleStock);
bot.callbackQuery("menu_account", handleMyAccount);
bot.callbackQuery("menu_orders", handleMyOrders);
bot.callbackQuery("menu_support", handleSupport);
bot.callbackQuery("menu_admin", handleAdminPanel);
bot.callbackQuery("back_main", handleStart);

bot.callbackQuery(/^cat_\d+$/, handleCategorySelect);
bot.callbackQuery(/^prod_\d+$/, handleProductSelect);
bot.callbackQuery(/^buy_\d+$/, handleBuy);
bot.callbackQuery("back_shop", handleBackShop);
bot.callbackQuery("noop", (ctx) => ctx.answerCallbackQuery());

bot.callbackQuery("back_admin", handleAdminPanel);
bot.callbackQuery(/^admin_/, handleAdminCallback);

bot.on("message:document", async (ctx) => {
  if (getAdminState(ctx.from.id)) {
    await handleAdminDocument(ctx);
  }
});

bot.on("message:text", async (ctx) => {
  if (getAdminState(ctx.from.id)) {
    await handleAdminMessage(ctx);
  }
});

async function autoBackup() {
  try {
    const [users, categories, products, stockItems, orders] = await Promise.all([
      prisma.user.findMany(),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.stockItem.findMany(),
      prisma.order.findMany(),
    ]);
    const backup = JSON.stringify({ users, categories, products, stockItems, orders }, (_, v) =>
      typeof v === "bigint" ? v.toString() : v, 2);
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.resolve(__dirname, `../auto-backup-${date}.json`);
    fs.writeFileSync(backupPath, backup);

    for (const adminId of config.adminIds) {
      try {
        await bot.api.sendDocument(adminId, new InputFile(backupPath, `auto-backup-${date}.json`), {
          caption: "💾 Auto Backup (24h)",
        });
      } catch {}
    }
    fs.unlinkSync(backupPath);
    console.log("Auto backup sent to admins");
  } catch (err) {
    console.error("Auto backup failed:", err);
  }
}

async function dailySalesReport() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: {
        product: { include: { category: true } },
        user: true,
      },
    });

    if (orders.length === 0) {
      const msg = "📊 Daily Sales Report\n━━━━━━━━━━━━━━━\n\nNo sales in the last 24 hours.";
      for (const adminId of config.adminIds) {
        try { await bot.api.sendMessage(adminId, msg); } catch {}
      }
      return;
    }

    const productCounts = new Map<string, { count: number; revenue: number }>();
    const buyerSpending = new Map<number, { name: string; spent: number }>();
    let totalRevenue = 0;

    for (const order of orders) {
      const price = (order.user.role === "dwkandar" && order.product.dwkandarPrice != null)
        ? order.product.dwkandarPrice
        : (order.user.role === "vip" && order.product.vipPrice != null)
        ? order.product.vipPrice
        : order.product.price;

      const key = `${order.product.category.name} > ${order.product.title}`;
      const existing = productCounts.get(key) || { count: 0, revenue: 0 };
      productCounts.set(key, { count: existing.count + 1, revenue: existing.revenue + price });

      const buyer = buyerSpending.get(order.userId) || { name: order.user.firstName || "?", spent: 0 };
      buyerSpending.set(order.userId, { name: buyer.name, spent: buyer.spent + price });

      totalRevenue += price;
    }

    let msg = "📊 Daily Sales Report\n━━━━━━━━━━━━━━━\n\n";
    msg += `🛒 Total Orders: ${orders.length}\n`;
    msg += `💰 Total Revenue: ${totalRevenue.toLocaleString()} IQD\n\n`;

    msg += "📦 Products Sold:\n─────────────────────\n";
    const sorted = Array.from(productCounts.entries()).sort((a, b) => b[1].count - a[1].count);
    for (const [name, data] of sorted) {
      msg += `${data.count}x ${name} — ${data.revenue.toLocaleString()} IQD\n`;
    }

    let topBuyer = { name: "", spent: 0 };
    for (const [, data] of buyerSpending) {
      if (data.spent > topBuyer.spent) topBuyer = data;
    }
    msg += `\n🏆 Top Buyer: ${topBuyer.name} — ${topBuyer.spent.toLocaleString()} IQD`;

    for (const adminId of config.adminIds) {
      try { await bot.api.sendMessage(adminId, msg); } catch {}
    }
    console.log("Daily sales report sent to admins");
  } catch (err) {
    console.error("Daily sales report failed:", err);
  }
}

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  await prisma.user.updateMany({
    where: { debtLimit: 0 },
    data: { debtLimit: 100000 },
  });

  setInterval(autoBackup, 24 * 60 * 60 * 1000);
  setInterval(dailySalesReport, 24 * 60 * 60 * 1000);
  console.log("Auto backup & daily sales report scheduled every 24 hours");

  await bot.api.setMyCommands([
    { command: "start", description: "دەستپێکردن" },
  ]);
  await bot.api.setChatMenuButton({
    menu_button: { type: "commands" },
  });

  bot.catch((err) => {
    console.error("Bot error:", err.message);
  });

  bot.start({
    onStart: () => console.log("Bot is running!"),
  });
}

main().catch(console.error);
