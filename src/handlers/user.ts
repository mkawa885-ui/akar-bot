import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../db";
import { config, isAdmin } from "../config";
import { t } from "../texts";

function buildPurchaseSummary(orders: { product: { title: string } }[]): string {
  const counts = new Map<string, number>();
  for (const o of orders) {
    counts.set(o.product.title, (counts.get(o.product.title) || 0) + 1);
  }
  if (counts.size === 0) return "";
  return Array.from(counts.entries()).map(([title, count]) => `${count}x ${title}`).join("\n");
}

export { buildPurchaseSummary };

const approvalRequests = new Map<number, number[]>();
const MAX_REQUESTS_PER_DAY = 2;

export async function ensureUser(ctx: Context) {
  if (!ctx.from) return null;
  return prisma.user.upsert({
    where: { telegramId: BigInt(ctx.from.id) },
    update: { username: ctx.from.username, firstName: ctx.from.first_name },
    create: {
      telegramId: BigInt(ctx.from.id),
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      approved: isAdmin(ctx.from.id),
    },
  });
}

export async function isApproved(ctx: Context): Promise<boolean> {
  if (!ctx.from) return false;
  if (isAdmin(ctx.from.id)) return true;
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from.id) },
  });
  return user?.approved ?? false;
}

export async function handleStart(ctx: Context) {
  const user = await ensureUser(ctx);
  if (!user) return;

  if (!user.approved && !isAdmin(ctx.from!.id)) {
    const userId = ctx.from!.id;
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const timestamps = (approvalRequests.get(userId) || []).filter(ts => ts > dayAgo);

    if (timestamps.length >= MAX_REQUESTS_PER_DAY) {
      await ctx.reply(t.requestLimitReached);
      return;
    }

    timestamps.push(now);
    approvalRequests.set(userId, timestamps);

    await ctx.reply(t.pendingApproval);
    const kb = new InlineKeyboard()
      .text("✅ پەسەند", `approve_${ctx.from!.id}`)
      .text("❌ ڕەت", `reject_${ctx.from!.id}`);
    for (const adminId of config.adminIds) {
      try {
        await ctx.api.sendMessage(
          adminId,
          t.newUserRequest(ctx.from!.id, ctx.from!.first_name || "?", ctx.from!.username),
          { reply_markup: kb }
        );
      } catch {}
    }
    return;
  }

  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  const kb = new InlineKeyboard()
    .text(t.shop, "menu_shop").row()
    .text(t.myAccount, "menu_account").text(t.myOrders, "menu_orders").row()
    .text(t.support, "menu_support");
  if (isAdmin(ctx.from!.id)) {
    kb.row().text(t.stock, "menu_stock").text(t.adminPanel, "menu_admin");
  }

  if (ctx.callbackQuery) {
    await ctx.editMessageText(t.welcome, { reply_markup: kb });
  } else {
    await ctx.reply(t.welcome, { reply_markup: kb });
  }
}

export async function handleApproval(ctx: Context) {
  if (!isAdmin(ctx.from!.id)) return;
  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery!.data!;
  const userId = parseInt(data.replace(/^(approve|reject)_/, ""));
  const approved = data.startsWith("approve_");

  if (approved) {
    await prisma.user.update({
      where: { telegramId: BigInt(userId) },
      data: { approved: true, debtLimit: 100000 },
    });
    await ctx.editMessageText(t.userApproved);
    try {
      await ctx.api.sendMessage(userId, t.approved);
    } catch {}
  } else {
    await ctx.editMessageText(t.userRejected);
    try {
      await ctx.api.sendMessage(userId, t.rejected);
    } catch {}
  }
}

export async function handleMyAccount(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  await ensureUser(ctx);
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from!.id) },
    include: { orders: { include: { product: true } } },
  });
  if (!user) return;
  const summary = buildPurchaseSummary(user.orders);
  const kb = new InlineKeyboard().text(t.back, "back_main");
  await ctx.editMessageText(t.accountInfo(user.debt, user.orders.length, user.debtLimit, user.role, summary), { reply_markup: kb });
}

export async function handleMyOrders(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from!.id) },
    include: { orders: { include: { product: true }, orderBy: { createdAt: "desc" }, take: 20 } },
  });

  const kb = new InlineKeyboard().text(t.back, "back_main");
  if (!user || user.orders.length === 0) {
    await ctx.editMessageText(t.noOrders, { reply_markup: kb });
    return;
  }

  const lines = user.orders.map((o) =>
    t.orderItem(o.id, o.product.title, o.createdAt.toLocaleDateString("en-US"))
  );
  await ctx.editMessageText(lines.join("\n\n"), { reply_markup: kb });
}

export async function handleSupport(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard().text(t.back, "back_main");
  await ctx.editMessageText(t.supportMessage(config.supportUsername), { reply_markup: kb });
}
