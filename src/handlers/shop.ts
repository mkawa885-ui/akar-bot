import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../db";
import { config } from "../config";
import { t } from "../texts";
import { ensureUser } from "./user";

export async function handleStock(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      products: {
        include: { stockItems: { where: { sold: false } } },
        orderBy: { title: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  if (categories.length === 0 || categories.every((c) => c.products.length === 0)) {
    const kb = new InlineKeyboard().text(t.back, "back_main");
    await ctx.editMessageText(t.noProducts, { reply_markup: kb });
    return;
  }

  const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
  const userRole = user?.role || "standard";

  let text = "📦 ستۆک\n━━━━━━━━━━━━━━━\n";
  for (const cat of categories) {
    if (cat.products.length === 0) continue;
    const catName = cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name;
    text += `\n💳 ${catName}\n─────────────────────\n`;
    for (const prod of cat.products) {
      const stock = prod.stockItems.length;
      const displayPrice = (userRole === "vip" && prod.vipPrice != null) ? prod.vipPrice : prod.price;
      text += `${prod.title} ● ${stock} دانە\n`;
      text += `▸ ${displayPrice.toLocaleString()} دینار\n`;
    }
  }

  const kb = new InlineKeyboard().text(t.back, "back_main");
  await ctx.editMessageText(text, { reply_markup: kb });
}

export async function handleShop(ctx: Context) {
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
  });

  const kb = new InlineKeyboard();
  if (categories.length === 0) {
    kb.text(t.back, "back_main");
    await ctx.editMessageText(t.noCategories, { reply_markup: kb });
    return;
  }

  for (const cat of categories) {
    kb.text(cat.name, `cat_${cat.id}`).row();
  }
  kb.text(t.back, "back_main");
  await ctx.editMessageText(t.selectCategory, { reply_markup: kb });
}

export async function handleCategorySelect(ctx: Context) {
  await ctx.answerCallbackQuery();
  const catId = parseInt(ctx.callbackQuery!.data!.replace("cat_", ""));

  const category = await prisma.category.findUnique({
    where: { id: catId },
    include: { children: { orderBy: { name: "asc" } } },
  });
  if (!category) return;

  // If has sub-categories, show them
  if (category.children.length > 0) {
    const kb = new InlineKeyboard();
    for (const sub of category.children) {
      kb.text(sub.name, `cat_${sub.id}`).row();
    }
    const backTarget = category.parentId ? `cat_${category.parentId}` : "back_shop";
    kb.text(t.back, backTarget);
    await ctx.editMessageText(t.selectCategory, { reply_markup: kb });
    return;
  }

  // Otherwise show products
  const products = await prisma.product.findMany({
    where: { categoryId: catId, enabled: true },
    include: { stockItems: { where: { sold: false } } },
    orderBy: { title: "asc" },
  });

  if (products.length === 0) {
    const backTarget = category.parentId ? `cat_${category.parentId}` : "back_shop";
    const kb2 = new InlineKeyboard().text(t.back, backTarget);
    await ctx.editMessageText(t.noProducts, { reply_markup: kb2 });
    return;
  }

  const kb = new InlineKeyboard();
  for (const prod of products) {
    if (prod.autoDeliver) {
      const stock = prod.stockItems.length;
      kb.text(`${prod.title} (${stock} دانە)`, `prod_${prod.id}`).row();
    } else {
      kb.text(prod.title, `prod_${prod.id}`).row();
    }
  }
  const backTarget = category.parentId ? `cat_${category.parentId}` : "back_shop";
  kb.text(t.back, backTarget);
  await ctx.editMessageText(t.selectProduct, { reply_markup: kb });
}

export async function handleProductSelect(ctx: Context) {
  await ctx.answerCallbackQuery();
  const prodId = parseInt(ctx.callbackQuery!.data!.replace("prod_", ""));

  const product = await prisma.product.findUnique({
    where: { id: prodId },
    include: { stockItems: { where: { sold: false } }, category: true },
  });

  if (!product) return;

  const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
  const userRole = user?.role || "standard";
  const stock = product.stockItems.length;
  const text = t.productDetails(product.title, product.description, product.price, product.vipPrice, stock, product.category.name, userRole);

  const kb = new InlineKeyboard();
  if (product.autoDeliver) {
    if (stock > 0) {
      kb.text(t.buy, `buy_${product.id}`).row();
    } else {
      kb.text(t.outOfStock, "noop").row();
    }
  } else {
    kb.text(t.buy, `buy_${product.id}`).row();
  }
  kb.text(t.back, `cat_${product.categoryId}`);
  await ctx.editMessageText(text, { reply_markup: kb });
}

export async function handleBuy(ctx: Context) {
  await ctx.answerCallbackQuery();
  await ensureUser(ctx);

  const prodId = parseInt(ctx.callbackQuery!.data!.replace("buy_", ""));

  const product = await prisma.product.findUnique({
    where: { id: prodId },
    include: { category: true },
  });
  if (!product) return;

  if (!product.enabled) {
    const kb = new InlineKeyboard().text(t.back, "back_main");
    await ctx.editMessageText(t.productUnavailable, { reply_markup: kb });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from!.id) },
  });
  if (!user) return;

  const actualPrice = (user.role === "vip" && product.vipPrice != null) ? product.vipPrice : product.price;

  if (user.debtLimit > 0 && (user.debt + actualPrice) > user.debtLimit) {
    const kb = new InlineKeyboard().text(t.back, "back_main");
    await ctx.editMessageText(t.debtLimitReached, { reply_markup: kb });
    return;
  }

  if (product.autoDeliver) {
    const stockItem = await prisma.stockItem.findFirst({
      where: { productId: prodId, sold: false },
      orderBy: { createdAt: "asc" },
    });

    if (!stockItem) {
      const kb = new InlineKeyboard().text(t.back, "back_main");
      await ctx.editMessageText(t.outOfStock, { reply_markup: kb });
      return;
    }

    const order = await prisma.order.create({
      data: { userId: user.id, productId: prodId, delivered: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { debt: { increment: actualPrice } },
    });

    await prisma.stockItem.update({
      where: { id: stockItem.id },
      data: { sold: true, orderId: order.id },
    });

    await ctx.api.sendMessage(ctx.from!.id, t.purchaseSuccess(stockItem.content), { parse_mode: "HTML" });
  } else {
    const order = await prisma.order.create({
      data: { userId: user.id, productId: prodId, delivered: false },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { debt: { increment: actualPrice } },
    });

    await ctx.api.sendMessage(ctx.from!.id, t.purchaseManualSuccess);

    const deliverKb = new InlineKeyboard().text(t.deliverOrder, `admin_deliver_${order.id}`);
    for (const adminId of config.adminIds) {
      try {
        await ctx.api.sendMessage(
          adminId,
          t.manualOrderNotify(order.id, ctx.from!.first_name || "?", ctx.from!.username, product.title, product.category.name, actualPrice),
          { reply_markup: deliverKb }
        );
      } catch {}
    }
  }

  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
  const prodInfo = await prisma.product.findUnique({ where: { id: prodId }, include: { category: true } });
  if (updatedUser && prodInfo) {
    const msg = t.orderNotifyAdmin(
      ctx.from!.first_name || "?",
      ctx.from!.username,
      prodInfo.title,
      prodInfo.category.name,
      actualPrice,
      updatedUser.debt
    );
    for (const adminId of config.adminIds) {
      try { await ctx.api.sendMessage(adminId, msg); } catch {}
    }

    if (prodInfo.autoDeliver) {
      const remaining = await prisma.stockItem.count({
        where: { productId: prodId, sold: false },
      });
      if (remaining <= prodInfo.lowStockAlert && remaining > 0) {
        for (const adminId of config.adminIds) {
          try { await ctx.api.sendMessage(adminId, t.lowStockAlert(prodInfo.title, remaining)); } catch {}
        }
      }
    }
  }
}

export async function handleBackShop(ctx: Context) {
  await ctx.answerCallbackQuery();
  await handleShopInline(ctx);
}

async function handleShopInline(ctx: Context) {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
  });
  const kb = new InlineKeyboard();
  if (categories.length === 0) {
    kb.text(t.back, "back_main");
    await ctx.editMessageText(t.noCategories, { reply_markup: kb });
    return;
  }
  for (const cat of categories) {
    kb.text(cat.name, `cat_${cat.id}`).row();
  }
  kb.text(t.back, "back_main");
  await ctx.editMessageText(t.selectCategory, { reply_markup: kb });
}
