import { Context, InlineKeyboard, InputFile } from "grammy";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { isAdmin } from "../config";
import { t } from "../texts";
import { buildPurchaseSummary } from "./user";

const adminState = new Map<number, { action: string; data?: any }>();

export function getAdminState(userId: number) {
  return adminState.get(userId);
}

export function clearAdminState(userId: number) {
  adminState.delete(userId);
}

export async function handleAdminPanel(ctx: Context) {
  if (!isAdmin(ctx.from!.id)) return;
  if (ctx.callbackQuery) await ctx.answerCallbackQuery();

  const kb = new InlineKeyboard()
    // Products & Stock
    .text(t.addCategory, "admin_add_cat").text(t.addProduct, "admin_add_prod").row()
    .text(t.addStock, "admin_add_stock").text(t.deleteStock, "admin_del_stock").row()
    .text(t.toggleProduct, "admin_toggle_prod").text(t.changePrice, "admin_change_price").row()
    .text(t.deleteCategory, "admin_del_cat").text(t.deleteProduct, "admin_del_prod").row()
    // Orders & Inventory
    .text(t.pendingOrders, "admin_pending").text(t.searchStock, "admin_search").row()
    .text(t.inventory, "admin_inventory").text(t.stats, "admin_stats").row()
    // Users
    .text(t.manageUsers, "admin_users").text(t.broadcast, "admin_broadcast").row()
    // System
    .text(t.exportDb, "admin_export_db").text(t.restoreDb, "admin_restore_db").row()
    .text(t.back, "back_main");

  await ctx.editMessageText(t.adminWelcome, { reply_markup: kb });
}

export async function handleAdminCallback(ctx: Context) {
  if (!isAdmin(ctx.from!.id)) return;
  await ctx.answerCallbackQuery();

  const data = ctx.callbackQuery!.data!;

  // Clear state unless mid-flow callback
  const keepPrefixes = ["admin_delivery_", "admin_prod_cat_", "admin_stock_prod_"];
  if (!keepPrefixes.some(p => data.startsWith(p)) && data !== "admin_cancel") {
    clearAdminState(ctx.from!.id);
  }

  if (data === "admin_cancel") {
    clearAdminState(ctx.from!.id);
    await handleAdminPanel(ctx);
    return;
  } else if (data === "admin_confirmstock") {
    const state = adminState.get(ctx.from!.id);
    if (state?.action === "confirm_stock" && state.data?.items) {
      const product = await prisma.product.findUnique({ where: { id: state.data.productId } });
      await prisma.stockItem.createMany({
        data: state.data.items.map((content: string) => ({
          content,
          productId: state.data.productId,
        })),
      });
      clearAdminState(ctx.from!.id);
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.stockAddedTo(state.data.items.length, product?.title || "?"), { reply_markup: kb });
    }
    return;
  } else if (data === "admin_add_cat") {
    adminState.set(ctx.from!.id, { action: "add_category" });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterCategoryName, { reply_markup: kb });
  } else if (data === "admin_add_prod") {
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noCategories, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const cat of categories) {
      kb.text(cat.name, `admin_prod_cat_${cat.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectCategoryForProduct, { reply_markup: kb });
  } else if (data.startsWith("admin_prod_cat_")) {
    const catId = parseInt(data.replace("admin_prod_cat_", ""));
    adminState.set(ctx.from!.id, { action: "add_product_title", data: { categoryId: catId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterProductTitle, { reply_markup: kb });
  } else if (data === "admin_add_stock") {
    const products = await prisma.product.findMany({ include: { category: true } });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const prod of products) {
      kb.text(`${prod.category.name} > ${prod.title}`, `admin_stock_prod_${prod.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectProductForStock, { reply_markup: kb });
  } else if (data.startsWith("admin_stock_prod_")) {
    const prodId = parseInt(data.replace("admin_stock_prod_", ""));
    adminState.set(ctx.from!.id, { action: "add_stock", data: { productId: prodId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterStockItems, { reply_markup: kb });
  } else if (data === "admin_del_stock") {
    const products = await prisma.product.findMany({
      include: { category: true, _count: { select: { stockItems: true } } },
    });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const prod of products) {
      kb.text(`${prod.category.name} > ${prod.title} (${prod._count.stockItems})`, `admin_delstock_${prod.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectProductForStockDelete, { reply_markup: kb });
  } else if (data.startsWith("admin_delstock_")) {
    const prodId = parseInt(data.replace("admin_delstock_", ""));
    const prod = await prisma.product.findUnique({ where: { id: prodId } });
    if (!prod) return;
    const available = await prisma.stockItem.count({ where: { productId: prodId, sold: false } });
    const kb = new InlineKeyboard()
      .text(t.deleteUnsoldStock, `admin_clearstock_unsold_${prodId}`).row()
      .text(t.deleteAllStock, `admin_clearstock_all_${prodId}`).row()
      .text(t.back, "admin_del_stock");
    await ctx.editMessageText(t.stockDeleteOptions(prod.title, available), { reply_markup: kb });
  } else if (data.startsWith("admin_clearstock_")) {
    const parts = data.replace("admin_clearstock_", "").split("_");
    const type = parts[0];
    const prodId = parseInt(parts[1]);
    const where = type === "all" ? { productId: prodId } : { productId: prodId, sold: false };
    const unsoldItems = await prisma.stockItem.findMany({ where: { productId: prodId, sold: false } });
    if (unsoldItems.length > 0) {
      const content = unsoldItems.map(i => i.content).join("\n");
      const chunks = content.match(/[\s\S]{1,4000}/g) || [];
      for (const chunk of chunks) {
        await ctx.api.sendMessage(ctx.from!.id, `<code>${chunk}</code>`, { parse_mode: "HTML" });
      }
    }
    const deleted = await prisma.stockItem.deleteMany({ where });
    const delKb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(t.stockDeleted(deleted.count), { reply_markup: delKb });
  } else if (data === "admin_toggle_prod") {
    const products = await prisma.product.findMany({ include: { category: true } });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const prod of products) {
      const status = prod.enabled ? "🟢" : "🔴";
      kb.text(`${status} ${prod.category.name} > ${prod.title}`, `admin_toggleprod_${prod.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectProductToToggle, { reply_markup: kb });
  } else if (data.startsWith("admin_toggleprod_")) {
    const prodId = parseInt(data.replace("admin_toggleprod_", ""));
    const prod = await prisma.product.findUnique({ where: { id: prodId } });
    if (!prod) return;
    const updated = await prisma.product.update({
      where: { id: prodId },
      data: { enabled: !prod.enabled },
    });
    const togKb = new InlineKeyboard().text(t.back, "admin_toggle_prod");
    await ctx.editMessageText(
      updated.enabled ? t.productEnabled(updated.title) : t.productDisabled(updated.title),
      { reply_markup: togKb }
    );
  } else if (data === "admin_change_price") {
    const products = await prisma.product.findMany({ include: { category: true } });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const prod of products) {
      const priceInfo = `${prod.price.toLocaleString()}${prod.vipPrice != null ? ` / VIP: ${prod.vipPrice.toLocaleString()}` : ""}`;
      kb.text(`${prod.category.name} > ${prod.title} (${priceInfo})`, `admin_priceprod_${prod.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectProductToChangePrice, { reply_markup: kb });
  } else if (data.startsWith("admin_priceprod_")) {
    const prodId = parseInt(data.replace("admin_priceprod_", ""));
    const prod = await prisma.product.findUnique({ where: { id: prodId } });
    if (!prod) return;
    const kb = new InlineKeyboard()
      .text(t.changeStandardPrice, `admin_setprice_${prodId}`).row()
      .text(t.changeVipPrice, `admin_setvipprice_${prodId}`).row()
      .text(t.back, "admin_change_price");
    await ctx.editMessageText(
      `${prod.title}\n\n💰 Standard: ${prod.price.toLocaleString()} IQD\n👑 VIP: ${prod.vipPrice != null ? prod.vipPrice.toLocaleString() + " IQD" : "N/A"}`,
      { reply_markup: kb }
    );
  } else if (data.startsWith("admin_setprice_")) {
    const prodId = parseInt(data.replace("admin_setprice_", ""));
    adminState.set(ctx.from!.id, { action: "change_price", data: { productId: prodId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterNewPrice, { reply_markup: kb });
  } else if (data.startsWith("admin_setvipprice_")) {
    const prodId = parseInt(data.replace("admin_setvipprice_", ""));
    adminState.set(ctx.from!.id, { action: "change_vip_price", data: { productId: prodId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterNewVipPrice, { reply_markup: kb });
  } else if (data === "admin_del_cat") {
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noCategories, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const cat of categories) {
      kb.text(`🗑️ ${cat.name}`, `admin_delcat_${cat.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectCategoryToDelete, { reply_markup: kb });
  } else if (data.startsWith("admin_delcat_")) {
    const catId = parseInt(data.replace("admin_delcat_", ""));
    const items = await prisma.stockItem.findMany({
      where: { product: { categoryId: catId }, sold: false },
    });
    if (items.length > 0) {
      const content = items.map(i => i.content).join("\n");
      const chunks = content.match(/[\s\S]{1,4000}/g) || [];
      for (const chunk of chunks) {
        await ctx.api.sendMessage(ctx.from!.id, `<code>${chunk}</code>`, { parse_mode: "HTML" });
      }
    }
    await prisma.category.delete({ where: { id: catId } });
    const kb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(t.categoryDeleted, { reply_markup: kb });
  } else if (data === "admin_del_prod") {
    const products = await prisma.product.findMany({ include: { category: true } });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const prod of products) {
      kb.text(`🗑️ ${prod.category.name} > ${prod.title}`, `admin_delprod_${prod.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.selectProductToDelete, { reply_markup: kb });
  } else if (data.startsWith("admin_delprod_")) {
    const prodId = parseInt(data.replace("admin_delprod_", ""));
    const items = await prisma.stockItem.findMany({ where: { productId: prodId, sold: false } });
    if (items.length > 0) {
      const content = items.map(i => i.content).join("\n");
      const chunks = content.match(/[\s\S]{1,4000}/g) || [];
      for (const chunk of chunks) {
        await ctx.api.sendMessage(ctx.from!.id, `<code>${chunk}</code>`, { parse_mode: "HTML" });
      }
    }
    await prisma.product.delete({ where: { id: prodId } });
    const kb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(t.productDeleted, { reply_markup: kb });
  } else if (data === "admin_delivery_auto" || data === "admin_delivery_manual") {
    const st = adminState.get(ctx.from!.id);
    if (!st || st.action !== "add_product_delivery") return;
    const autoDeliver = data === "admin_delivery_auto";
    await prisma.product.create({
      data: {
        title: st.data.title,
        description: st.data.description,
        price: st.data.price,
        vipPrice: st.data.vipPrice,
        categoryId: st.data.categoryId,
        autoDeliver,
      },
    });
    clearAdminState(ctx.from!.id);
    const kb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(t.productAdded, { reply_markup: kb });
  } else if (data === "admin_pending") {
    const orders = await prisma.order.findMany({
      where: { delivered: false, product: { autoDeliver: false } },
      include: { user: true, product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (orders.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noPendingOrders, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const order of orders) {
      kb.text(
        `#${order.id} ${order.user.firstName || "?"} - ${order.product.title}`,
        `admin_deliver_${order.id}`
      ).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.pendingOrders, { reply_markup: kb });
  } else if (data.startsWith("admin_deliver_")) {
    const orderId = parseInt(data.replace("admin_deliver_", ""));
    adminState.set(ctx.from!.id, { action: "deliver_order", data: { orderId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterDeliveryContent, { reply_markup: kb });
  } else if (data === "admin_search") {
    adminState.set(ctx.from!.id, { action: "search_stock" });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterSearchQuery, { reply_markup: kb });
  } else if (data === "admin_users") {
    const users = await prisma.user.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (users.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noUsers, { reply_markup: kb });
      return;
    }
    const kb = new InlineKeyboard();
    for (const user of users) {
      const label = `${user.firstName || "?"} - ${user.debt.toLocaleString()} IQD (${user._count.orders})`;
      kb.text(label, `admin_user_${user.id}`).row();
    }
    kb.text(t.back, "back_admin");
    await ctx.editMessageText(t.userListTitle, { reply_markup: kb });
  } else if (data.startsWith("admin_user_")) {
    const userId = parseInt(data.replace("admin_user_", ""));
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { orders: { include: { product: true } } },
    });
    if (!user) return;
    const summary = buildPurchaseSummary(user.orders);
    const text = t.userDetail(
      user.firstName || "?",
      user.username,
      user.debt,
      user.orders.length,
      user.debtLimit,
      user.role,
      summary
    );
    const kb = new InlineKeyboard()
      .text(t.setRole, `admin_role_${user.id}`).row()
      .text(t.clearDebt, `admin_cleardebt_${user.id}`).row()
      .text(t.addDebt, `admin_adddebt_${user.id}`).row()
      .text(t.setDebtLimit, `admin_setlimit_${user.id}`).row()
      .text("📄 Purchase History", `admin_history_${user.id}`).row()
      .text(t.revokeAccess, `admin_revoke_${user.id}`).row()
      .text(t.back, "admin_users");
    await ctx.editMessageText(text, { reply_markup: kb });
  } else if (data.startsWith("admin_role_")) {
    const userId = parseInt(data.replace("admin_role_", ""));
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const kb = new InlineKeyboard()
      .text(t.roleStandard, `admin_setrole_${userId}_standard`)
      .text(t.roleVip, `admin_setrole_${userId}_vip`).row()
      .text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText(`Current role: ${user.role === "vip" ? "👑 VIP" : "📋 Standard"}\n\nSelect a role:`, { reply_markup: kb });
  } else if (data.startsWith("admin_setrole_")) {
    const parts = data.replace("admin_setrole_", "").split("_");
    const userId = parseInt(parts[0]);
    const newRole = parts[1];
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    const roleKb = new InlineKeyboard().text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText(t.roleChanged(newRole), { reply_markup: roleKb });
    try { await ctx.api.sendMessage(Number(user.telegramId), t.roleChangedNotify(newRole)); } catch {}
  } else if (data.startsWith("admin_cleardebt_")) {
    const userId = parseInt(data.replace("admin_cleardebt_", ""));
    const kb = new InlineKeyboard()
      .text("🧹 Clear All", `admin_clearall_${userId}`).row()
      .text("💰 Custom Amount", `admin_partialdebt_${userId}`).row()
      .text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText("How much debt to clear?", { reply_markup: kb });
  } else if (data.startsWith("admin_clearall_")) {
    const userId = parseInt(data.replace("admin_clearall_", ""));
    const oldUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!oldUser) return;
    const clearedAmount = oldUser.debt;
    const user = await prisma.user.update({ where: { id: userId }, data: { debt: 0 } });
    const debtKb = new InlineKeyboard().text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText(t.debtClearedAmount(oldUser.firstName || "?", clearedAmount), { reply_markup: debtKb });
    try { await ctx.api.sendMessage(Number(user.telegramId), t.debtClearedNotifyAmount(clearedAmount)); } catch {}
  } else if (data.startsWith("admin_partialdebt_")) {
    const userId = parseInt(data.replace("admin_partialdebt_", ""));
    adminState.set(ctx.from!.id, { action: "partial_debt", data: { userId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText("Enter the amount to deduct (number in IQD):", { reply_markup: kb });
  } else if (data.startsWith("admin_adddebt_")) {
    const userId = parseInt(data.replace("admin_adddebt_", ""));
    adminState.set(ctx.from!.id, { action: "add_debt", data: { userId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterDebtAmount, { reply_markup: kb });
  } else if (data.startsWith("admin_setlimit_")) {
    const userId = parseInt(data.replace("admin_setlimit_", ""));
    adminState.set(ctx.from!.id, { action: "set_debt_limit", data: { userId } });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.enterDebtLimit, { reply_markup: kb });
  } else if (data.startsWith("admin_history_")) {
    const userId = parseInt(data.replace("admin_history_", ""));
    const kb = new InlineKeyboard()
      .text("💰 Current Debt", `admin_histdebt_${userId}`).row()
      .text("📋 Lifetime", `admin_histall_${userId}`).row()
      .text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText("Select purchase history range:", { reply_markup: kb });
  } else if (data.startsWith("admin_histdebt_") || data.startsWith("admin_histall_")) {
    const isDebt = data.startsWith("admin_histdebt_");
    const userId = parseInt(data.replace(/^admin_hist(debt|all)_/, ""));
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { product: { include: { category: true } }, stockItems: true },
      orderBy: { createdAt: "desc" },
    });

    let selectedOrders = orders;
    if (isDebt && user.debt > 0) {
      let total = 0;
      selectedOrders = [];
      for (const order of orders) {
        const price = (user.role === "vip" && order.product.vipPrice != null) ? order.product.vipPrice : order.product.price;
        total += price;
        selectedOrders.push(order);
        if (total >= user.debt) break;
      }
    } else if (isDebt && user.debt <= 0) {
      selectedOrders = [];
    }

    const label = isDebt ? "Current Debt" : "Lifetime";
    let txt = `Purchase History - ${user.firstName || "?"}${user.username ? ` (@${user.username})` : ""}\n`;
    txt += `Range: ${label}\n`;
    txt += `Generated: ${new Date().toISOString().split("T")[0]}\n`;
    txt += `Current Debt: ${user.debt.toLocaleString()} IQD\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (selectedOrders.length === 0) {
      txt += "No orders found.\n";
    } else {
      let totalSpent = 0;
      for (let i = 0; i < selectedOrders.length; i++) {
        const o = selectedOrders[i];
        const price = (user.role === "vip" && o.product.vipPrice != null) ? o.product.vipPrice : o.product.price;
        totalSpent += price;
        txt += `#${i + 1} | ${o.createdAt.toLocaleString("en-US")}\n`;
        txt += `   Product: ${o.product.category.name} > ${o.product.title}\n`;
        txt += `   Price: ${price.toLocaleString()} IQD\n`;
        txt += `   Status: ${o.delivered ? "Delivered" : "Pending"}\n`;
        const stock = o.stockItems.find(s => s.orderId === o.id);
        if (stock) {
          txt += `   Content: ${stock.content}\n`;
        }
        txt += `\n`;
      }
      txt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      txt += `Total Orders: ${selectedOrders.length}\n`;
      txt += `Total Spent: ${totalSpent.toLocaleString()} IQD\n`;
    }

    const filePath = path.resolve(__dirname, `../../history-${user.id}-${Date.now()}.txt`);
    fs.writeFileSync(filePath, txt);
    await ctx.api.sendDocument(ctx.from!.id, new InputFile(filePath, `history-${user.firstName || "user"}-${label.replace(" ", "-")}.txt`));
    fs.unlinkSync(filePath);
    const kb = new InlineKeyboard().text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText(`📄 Purchase history (${label}) sent as file.`, { reply_markup: kb });
  } else if (data.startsWith("admin_revoke_")) {
    const userId = parseInt(data.replace("admin_revoke_", ""));
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const kb = new InlineKeyboard()
      .text(t.revokeYes, `admin_revokeyes_${userId}`).row()
      .text(t.back, `admin_user_${userId}`);
    await ctx.editMessageText(t.revokeConfirm(user.firstName || "?"), { reply_markup: kb });
  } else if (data.startsWith("admin_revokeyes_")) {
    const userId = parseInt(data.replace("admin_revokeyes_", ""));
    const user = await prisma.user.update({
      where: { id: userId },
      data: { approved: false },
    });
    const kb = new InlineKeyboard().text(t.back, "admin_users");
    await ctx.editMessageText(t.accessRevoked, { reply_markup: kb });
    try { await ctx.api.sendMessage(Number(user.telegramId), t.accessRevokedNotify); } catch {}
  } else if (data === "admin_inventory") {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stockItems: true,
      },
      orderBy: { title: "asc" },
    });
    if (products.length === 0) {
      const kb = new InlineKeyboard().text(t.back, "back_admin");
      await ctx.editMessageText(t.noProducts, { reply_markup: kb });
      return;
    }
    let text = "📋 Inventory:\n\n";
    for (const prod of products) {
      const available = prod.stockItems.filter((s) => !s.sold).length;
      const sold = prod.stockItems.filter((s) => s.sold).length;
      text += `📂 ${prod.category.name} > 📦 ${prod.title}\n`;
      text += `   🟢 Available: ${available} | 🔴 Sold: ${sold}\n\n`;
    }
    const kb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(text, { reply_markup: kb });
  } else if (data === "admin_stats") {
    const [users, products, orders, stock] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.stockItem.count({ where: { sold: false } }),
    ]);
    const statsKb = new InlineKeyboard().text(t.back, "back_admin");
    await ctx.editMessageText(t.statsMessage(users, products, orders, stock), { reply_markup: statsKb });
  } else if (data === "admin_export_db") {
    await ctx.editMessageText(t.exportDbSending);
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
      const backupPath = path.resolve(__dirname, `../../backup-${date}.json`);
      fs.writeFileSync(backupPath, backup);
      await ctx.api.sendDocument(ctx.from!.id, new InputFile(backupPath, `backup-${date}.json`));
      fs.unlinkSync(backupPath);
    } catch (err) {
      console.error("Export failed:", err);
    }
  } else if (data === "admin_restore_db") {
    adminState.set(ctx.from!.id, { action: "restore_db" });
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(t.restoreDbPrompt, { reply_markup: kb });
  } else if (data === "admin_broadcast") {
    const kb = new InlineKeyboard()
      .text("📢 All Users", "admin_bcast_all").row()
      .text("📋 Standard Only", "admin_bcast_standard").row()
      .text("👑 VIP Only", "admin_bcast_vip").row()
      .text(t.back, "back_admin");
    await ctx.editMessageText("Select broadcast audience:", { reply_markup: kb });
  } else if (data === "admin_bcast_all" || data === "admin_bcast_standard" || data === "admin_bcast_vip") {
    const audience = data.replace("admin_bcast_", "");
    adminState.set(ctx.from!.id, { action: "broadcast", data: { audience } });
    const label = audience === "all" ? "all users" : audience === "vip" ? "VIP users" : "Standard users";
    const kb = new InlineKeyboard().text(t.cancel, "admin_cancel");
    await ctx.editMessageText(`Enter the message to broadcast to ${label}:`, { reply_markup: kb });
  }
}

export async function handleAdminMessage(ctx: Context) {
  if (!ctx.from || !ctx.message?.text) return;

  const state = adminState.get(ctx.from.id);
  if (!state) return false;

  const text = ctx.message.text;

  if (text === t.cancel) {
    clearAdminState(ctx.from.id);
    await ctx.reply(t.cancelled);
    return true;
  }

  switch (state.action) {
    case "add_category": {
      await prisma.category.create({ data: { name: text } });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.categoryAdded);
      return true;
    }
    case "add_product_title": {
      adminState.set(ctx.from.id, {
        action: "add_product_desc",
        data: { ...state.data, title: text },
      });
      await ctx.reply(t.enterProductDescription);
      return true;
    }
    case "add_product_desc": {
      adminState.set(ctx.from.id, {
        action: "add_product_price",
        data: { ...state.data, description: text },
      });
      await ctx.reply(t.enterProductPrice);
      return true;
    }
    case "add_product_price": {
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      adminState.set(ctx.from.id, {
        action: "add_product_vip_price",
        data: { ...state.data, price },
      });
      await ctx.reply(t.enterVipPrice);
      return true;
    }
    case "add_product_vip_price": {
      const vipPrice = parseFloat(text);
      if (isNaN(vipPrice) || vipPrice < 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      adminState.set(ctx.from.id, {
        action: "add_product_delivery",
        data: { ...state.data, vipPrice: vipPrice > 0 ? vipPrice : null },
      });
      const kb = new InlineKeyboard()
        .text(t.autoDelivery, "admin_delivery_auto")
        .text(t.manualDelivery, "admin_delivery_manual");
      await ctx.reply(t.selectDeliveryType, { reply_markup: kb });
      return true;
    }
    case "add_stock": {
      const items = text
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      const product = await prisma.product.findUnique({ where: { id: state.data.productId } });
      if (!product) return true;
      adminState.set(ctx.from.id, { action: "confirm_stock", data: { productId: state.data.productId, items } });
      const kb = new InlineKeyboard()
        .text("✅ Yes, Add", "admin_confirmstock")
        .text(t.cancel, "admin_cancel");
      await ctx.reply(t.confirmStockAdd(items.length, product.title), { reply_markup: kb });
      return true;
    }
    case "broadcast": {
      const audience = state.data?.audience || "all";
      const where: any = {};
      if (audience === "standard") where.role = "standard";
      else if (audience === "vip") where.role = "vip";
      const users = await prisma.user.findMany({ where });
      let sent = 0;
      for (const user of users) {
        try {
          await ctx.api.sendMessage(Number(user.telegramId), text);
          sent++;
        } catch {}
      }
      clearAdminState(ctx.from.id);
      const label = audience === "all" ? "" : audience === "vip" ? " VIP" : " Standard";
      await ctx.reply(`✅ Message sent to ${sent}${label} users.`);
      return true;
    }
    case "deliver_order": {
      const order = await prisma.order.findUnique({
        where: { id: state.data.orderId },
        include: { user: true },
      });
      if (!order) {
        clearAdminState(ctx.from.id);
        await ctx.reply("❌ Order not found.");
        return true;
      }
      await prisma.order.update({
        where: { id: order.id },
        data: { delivered: true },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.orderDelivered);
      try {
        await ctx.api.sendMessage(
          Number(order.user.telegramId),
          t.orderDeliveredNotify(text),
          { parse_mode: "HTML" }
        );
      } catch {}
      return true;
    }
    case "search_stock": {
      const results = await prisma.stockItem.findMany({
        where: { content: { contains: text } },
        include: { product: { include: { category: true } } },
        take: 20,
      });
      clearAdminState(ctx.from.id);
      if (results.length === 0) {
        await ctx.reply(t.noSearchResults(text));
        return true;
      }
      let msg = t.searchResults(text, results.length) + "\n\n";
      for (const item of results) {
        const status = item.sold ? t.stockSold : t.stockAvailable;
        msg += `${status} | 📂 ${item.product.category.name} > ${item.product.title}\n`;
        msg += `📄 ${item.content}\n\n`;
      }
      await ctx.reply(msg);
      return true;
    }
    case "add_debt": {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      const updatedUser = await prisma.user.update({
        where: { id: state.data.userId },
        data: { debt: { increment: amount } },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.debtAdded(updatedUser.firstName || "User", amount));
      try { await ctx.api.sendMessage(Number(updatedUser.telegramId), t.debtAddedNotify(amount, updatedUser.debt)); } catch {}
      return true;
    }
    case "partial_debt": {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      const oldUser = await prisma.user.findUnique({ where: { id: state.data.userId } });
      if (!oldUser) return true;
      const deductAmount = Math.min(amount, oldUser.debt);
      const user = await prisma.user.update({
        where: { id: state.data.userId },
        data: { debt: { decrement: deductAmount } },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.debtClearedAmount(oldUser.firstName || "?", deductAmount));
      try { await ctx.api.sendMessage(Number(user.telegramId), t.debtClearedNotifyAmount(deductAmount)); } catch {}
      return true;
    }
    case "set_debt_limit": {
      const limit = parseFloat(text);
      if (isNaN(limit) || limit < 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      await prisma.user.update({
        where: { id: state.data.userId },
        data: { debtLimit: limit },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.debtLimitSet(limit));
      return true;
    }
    case "change_price": {
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      const prod = await prisma.product.update({
        where: { id: state.data.productId },
        data: { price },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.priceChanged(prod.title, price));
      return true;
    }
    case "change_vip_price": {
      const vipPrice = parseFloat(text);
      if (isNaN(vipPrice) || vipPrice < 0) {
        await ctx.reply(t.invalidPrice);
        return true;
      }
      const prod = await prisma.product.update({
        where: { id: state.data.productId },
        data: { vipPrice: vipPrice > 0 ? vipPrice : null },
      });
      clearAdminState(ctx.from.id);
      await ctx.reply(t.vipPriceChanged(prod.title, vipPrice));
      return true;
    }
  }

  return false;
}

export async function handleAdminDocument(ctx: Context) {
  if (!ctx.from || !ctx.message?.document) return false;
  const state = adminState.get(ctx.from.id);
  if (!state || state.action !== "restore_db") return false;

  const fileName = ctx.message.document.file_name || "";
  if (!fileName.endsWith(".json")) {
    await ctx.reply(t.restoreInvalidFile);
    return true;
  }

  try {
    const file = await ctx.getFile();
    const filePath = `https://api.telegram.org/file/bot${(await import("../config")).config.botToken}/${file.file_path}`;

    const response = await fetch(filePath);
    const buffer = Buffer.from(await response.arrayBuffer());
    const jsonData = JSON.parse(buffer.toString("utf-8"));

      if (jsonData.users) {
        for (const u of jsonData.users) {
          await prisma.user.upsert({
            where: { id: u.id },
            update: { telegramId: BigInt(u.telegramId), username: u.username, firstName: u.firstName, approved: u.approved, role: u.role ?? "standard", debt: u.debt ?? 0, debtLimit: u.debtLimit ?? 0 },
            create: { id: u.id, telegramId: BigInt(u.telegramId), username: u.username, firstName: u.firstName, approved: u.approved, role: u.role ?? "standard", debt: u.debt ?? 0, debtLimit: u.debtLimit ?? 0 },
          });
        }
      }
      if (jsonData.categories) {
        for (const cat of jsonData.categories) {
          await prisma.category.upsert({
            where: { id: cat.id },
            update: { name: cat.name },
            create: { id: cat.id, name: cat.name },
          });
        }
      }
      if (jsonData.products) {
        for (const prod of jsonData.products) {
          const prodData = {
            title: prod.title,
            description: prod.description,
            price: prod.price,
            vipPrice: prod.vipPrice ?? null,
            autoDeliver: prod.autoDeliver ?? true,
            enabled: prod.enabled ?? true,
            lowStockAlert: prod.lowStockAlert ?? 5,
            categoryId: prod.categoryId,
          };
          await prisma.product.upsert({
            where: { id: prod.id },
            update: prodData,
            create: { id: prod.id, ...prodData },
          });
        }
      }
      if (jsonData.stockItems) {
        for (const item of jsonData.stockItems) {
          await prisma.stockItem.upsert({
            where: { id: item.id },
            update: { content: item.content, productId: item.productId, sold: item.sold ?? false },
            create: { id: item.id, content: item.content, productId: item.productId, sold: item.sold ?? false },
          });
        }
      }
      if (jsonData.orders) {
        for (const o of jsonData.orders) {
          await prisma.order.upsert({
            where: { id: o.id },
            update: { userId: o.userId, productId: o.productId, status: o.status ?? "pending", delivered: o.delivered ?? false },
            create: { id: o.id, userId: o.userId, productId: o.productId, status: o.status ?? "pending", delivered: o.delivered ?? false },
          });
        }
      }
      clearAdminState(ctx.from.id);
      await ctx.reply(t.restoreSuccess);
  } catch (err) {
    console.error("Restore failed:", err);
    clearAdminState(ctx.from.id);
    await ctx.reply(t.restoreFailed);
  }

  return true;
}
