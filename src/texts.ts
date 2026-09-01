export const t = {
  welcome: "بەخێربێیت بۆ فرۆشگاکەمان! 🛒\n\nلێرەوە دەتوانیت ئەکاونت و کۆد بکڕیت.",
  welcomeBack: "بەخێربێیتەوە! 👋",

  // Main menu
  stock: "📦 ستۆک",
  shop: "🛒 فرۆشگا",
  myAccount: "👤 هەژمارەکەم",
  myOrders: "📦 داواکارییەکانم",
  support: "💬 پشتگیری",
  adminPanel: "⚙️ پانێڵی ئەدمین",

  // Shop
  categories: "📁 بەشەکان",
  selectCategory: "بەشێک هەڵبژێرە:",
  noCategories: "هیچ بەشێک نییە تا ئێستا.",
  selectProduct: "بەرهەمێک هەڵبژێرە:",
  noProducts: "هیچ بەرهەمێک نییە لەم بەشەدا.",
  productDetails: (title: string, desc: string, price: number, vipPrice: number | null, dwkandarPrice: number | null, stock: number, category: string, role: string) => {
    const displayPrice = (role === "dwkandar" && dwkandarPrice != null) ? dwkandarPrice : (role === "vip" && vipPrice != null) ? vipPrice : price;
    return `📦 بەرهەم: ${title}\n📂 بەش: ${category}\n\n📝 وەسف:\n${desc}\n\n💰 نرخ: ${displayPrice.toLocaleString()} دینار\n🟢 ئامادە: ${stock} دانە`;
  },
  outOfStock: "❌ ئەم بەرهەمە بەردەست نییە.",
  buy: "🛒 بیکڕە",
  back: "🔙 گەڕانەوە",

  // Purchase
  purchaseSuccess: (content: string) =>
    `کڕینەکەت سەرکەوتوو بوو!\n\nئەمە بەرهەمەکەتە:\n\n<code>${content}</code>\n\nسوپاس بۆ کڕینەکەت!`,
  purchaseManualSuccess: "✅ داواکاریەکەت تۆمارکرا!\n\n⏳ بەرهەمەکەت ئامادە دەکرێت و بۆت دەنێردرێت.\nتکایە چاوەڕوان بە.",
  manualOrderNotify: (orderId: number, name: string, username: string | undefined, productTitle: string, category: string, price: number) =>
    `🔔 Manual Order!\n\n📋 Order #${orderId}\n👤 ${name}${username ? ` (@${username})` : ""}\n📦 ${category} > ${productTitle}\n💰 Price: ${price.toLocaleString()} IQD\n\nPlease prepare and deliver the product.`,
  deliverOrder: "📬 Deliver",
  enterDeliveryContent: "Enter the product content to send to the buyer:",
  orderDelivered: "✅ Product delivered to buyer!",
  orderDeliveredNotify: (content: string) =>
    `بەرهەمەکەت ئامادەیە!\n\nئەمە بەرهەمەکەتە:\n\n<code>${content}</code>\n\nسوپاس بۆ کڕینەکەت!`,
  pendingOrders: "📬 Pending Orders",
  noPendingOrders: "No pending orders.",
  toggleProduct: "🔄 Toggle Product",
  changePrice: "💰 Change Price",
  selectProductToChangePrice: "Select a product to change price:",
  changeStandardPrice: "💰 Change Standard Price",
  changeVipPrice: "👑 Change VIP Price",
  changeDwkandarPrice: "🏪 Change Dwkandar Price",
  enterNewPrice: "Enter new standard price (number in IQD):",
  enterNewVipPrice: "Enter new VIP price (number in IQD, 0 to remove VIP price):",
  enterNewDwkandarPrice: "Enter new Dwkandar price (number in IQD, 0 to remove Dwkandar price):",
  priceChanged: (title: string, price: number) => `✅ "${title}" standard price changed to ${price.toLocaleString()} IQD.`,
  vipPriceChanged: (title: string, price: number) => price > 0 ? `✅ "${title}" VIP price changed to ${price.toLocaleString()} IQD.` : `✅ "${title}" VIP price removed.`,
  dwkandarPriceChanged: (title: string, price: number) => price > 0 ? `✅ "${title}" Dwkandar price changed to ${price.toLocaleString()} IQD.` : `✅ "${title}" Dwkandar price removed.`,
  selectProductToToggle: "Select a product to enable/disable:",
  productEnabled: (title: string) => `✅ "${title}" enabled — buyers can purchase it.`,
  productDisabled: (title: string) => `🚫 "${title}" disabled — buyers cannot purchase it.`,
  productUnavailable: "🚫 ئەم بەرهەمە لە ئێستادا بەردەست نییە.",
  lowStockAlert: (title: string, remaining: number) =>
    `⚠️ Low stock for "${title}"!\n\n📦 Remaining: ${remaining} items\nPlease restock.`,
  purchaseFailed: "❌ کڕینەکە سەرنەکەوت. تکایە دواتر هەوڵبدەرەوە.",
  orderNotifyAdmin: (name: string, username: string | undefined, productTitle: string, category: string, price: number, debt: number) =>
    `🛒 New Order!\n\n👤 ${name}${username ? ` (@${username})` : ""}\n📦 ${category} > ${productTitle}\n💰 Price: ${price.toLocaleString()} IQD\n💳 Total Debt: ${debt.toLocaleString()} IQD`,

  // Orders
  noOrders: "هیچ داواکارییەکت نییە تا ئێستا.",
  orderItem: (id: number, title: string, date: string) =>
    `📦 #${id} - ${title}\n📅 ${date}`,

  // Support
  supportMessage: (username: string) =>
    `💬 بۆ پشتگیری پەیوەندی بکە بە:\n@${username.replace(/^@/, "")}`,

  // Admin
  adminWelcome: "Welcome to Admin Panel ⚙️",
  addCategory: "📁 Add Category",
  addProduct: "📦 Add Product",
  addStock: "🔑 Add Stock",
  deleteCategory: "🗑️ Delete Category",
  deleteStock: "🗑️ Delete Stock",
  deleteProduct: "🗑️ Delete Product",
  manageUsers: "👥 Manage Users",
  searchStock: "🔍 Search Stock",
  enterSearchQuery: "Enter email or part of the account content to search:",
  searchResults: (query: string, count: number) => `🔍 Search results for "${query}": ${count} items`,
  noSearchResults: (query: string) => `❌ No results found for "${query}"`,
  stockSold: "🔴 Sold",
  stockAvailable: "🟢 Available",
  inventory: "📋 Inventory",
  stats: "📊 Statistics",
  exportDb: "💾 Export Database",
  exportDbSending: "⏳ Sending database...",
  restoreDb: "📥 Restore Database",
  restoreDbPrompt: "Send the database file (.json)\n\n⚠️ Warning: This will replace all current data!",
  restoreSuccess: "✅ Database restored successfully!",
  restoreFailed: "❌ Restore failed. Please send a valid file.",
  restoreInvalidFile: "❌ Please send a .json file.",
  broadcast: "📢 Broadcast",

  // Admin prompts
  enterCategoryName: "Enter category name:",
  categoryAdded: "✅ Category added!",
  selectCategoryForProduct: "Select a category for the product:",
  enterProductTitle: "Enter product title:",
  enterProductDescription: "Enter product description:",
  enterVipPrice: "Enter VIP price (number in IQD, 0 for no VIP price):",
  enterDwkandarPrice: "Enter Dwkandar price (number in IQD, 0 for no Dwkandar price):",
  selectDeliveryType: "Select delivery type:",
  autoDelivery: "⚡ Auto (from stock)",
  manualDelivery: "✋ Manual (prepare on order)",
  enterProductPrice: "Enter product price (number):",
  invalidPrice: "❌ Please enter a valid number.",
  productAdded: "✅ Product added!",
  selectProductForStock: "Select a product to add stock:",
  enterStockItems: "Enter stock items, one per line:\n\nExample:\nemail@mail.com:pass123\nemail2@mail.com:pass456",
  stockAdded: (count: number) => `✅ ${count} stock items added!`,
  confirmStockAdd: (count: number, title: string) => `⚠️ Add ${count} item(s) to "${title}"?\n\nConfirm?`,
  stockAddedTo: (count: number, title: string) => `✅ ${count} item(s) added to "${title}".`,
  selectCategoryToDelete: "Select a category to delete:",
  categoryDeleted: "✅ Category deleted!",
  selectProductForStockDelete: "Select a product to delete stock:",
  stockDeleteOptions: (title: string, available: number) => `🗑️ Delete stock for "${title}"\n\n🟢 Available: ${available} items\n\nWhat to delete?`,
  deleteAllStock: "🗑️ Delete All Stock",
  deleteUnsoldStock: "🗑️ Delete Unsold Only",
  stockDeleted: (count: number) => `✅ ${count} stock items deleted!`,
  selectProductToDelete: "Select a product to delete:",
  productDeleted: "✅ Product deleted!",
  enterBroadcast: "Enter the message to broadcast to all users:",
  broadcastSent: (count: number) => `✅ Message sent to ${count} users.`,
  broadcastFailed: "❌ Message failed to send.",
  statsMessage: (users: number, products: number, orders: number, stock: number) =>
    `📊 Statistics:\n\n👥 Users: ${users}\n📦 Products: ${products}\n🛒 Orders: ${orders}\n🔑 Available Stock: ${stock}`,

  // Account
  accountInfo: (debt: number, orderCount: number, limit: number, role: string, purchaseSummary: string) => {
    const roleLabel = role === "vip" ? "👑 VIP" : role === "dwkandar" ? "🏪 Dwkandar" : "📋 Standard";
    return `👤 هەژمارەکەم\n\n${roleLabel}\n💰 قەرز: ${debt.toLocaleString()} دینار\n📦 کۆی داواکارییەکان: ${orderCount}\n🔒 سنووری قەرز: ${limit > 0 ? limit.toLocaleString() + " دینار" : "نادیار"}${purchaseSummary ? `\n\n🛒 کڕینەکان:\n${purchaseSummary}` : ""}`;
  },
  noDebt: "✅ هیچ قەرزێکت نییە!",
  debtLimitReached: "❌ تۆ گەیشتویت بە سنووری قەرزەکەت. تکایە قەرزەکەت بسڕەوە پێش کڕینی نوێ.",

  // User management
  userListTitle: "👥 Users:",
  userDetail: (name: string, username: string | null, debt: number, orders: number, limit: number, role: string, purchaseSummary: string) => {
    const roleLabel = role === "vip" ? "👑 VIP" : role === "dwkandar" ? "🏪 Dwkandar" : "📋 Standard";
    return `👤 ${name}${username ? ` (@${username})` : ""}\n${roleLabel}\n\n💰 Debt: ${debt.toLocaleString()} IQD\n📦 Orders: ${orders}\n🔒 Debt Limit: ${limit > 0 ? limit.toLocaleString() + " IQD" : "Unlimited"}${purchaseSummary ? `\n\n🛒 Purchases:\n${purchaseSummary}` : ""}`;
  },
  setRole: "👑 Change Role",
  roleStandard: "📋 Standard",
  roleVip: "👑 VIP",
  roleDwkandar: "🏪 Dwkandar",
  roleChanged: (role: string) => {
    const label = role === "vip" ? "👑 VIP" : role === "dwkandar" ? "🏪 Dwkandar" : "📋 Standard";
    return `✅ User role changed to ${label}`;
  },
  roleChangedNotify: (role: string) => role === "vip"
    ? "👑 ڕۆڵەکەت گۆڕدرا بۆ VIP! ئێستا نرخی VIP بۆت دەردەکەوێت."
    : role === "dwkandar"
    ? "🏪 ڕۆڵەکەت گۆڕدرا بۆ Dwkandar! ئێستا نرخی Dwkandar بۆت دەردەکەوێت."
    : "📋 ڕۆڵەکەت گۆڕدرا بۆ Standard.",
  clearDebt: "🧹 Clear Debt",
  addDebt: "➕ Add Debt",
  setDebtLimit: "🔒 Set Debt Limit",
  enterDebtAmount: "Enter debt amount (number in IQD):",
  enterDebtLimit: "Enter debt limit (number in IQD, 0 for unlimited):",
  debtCleared: "✅ Debt cleared!",
  debtClearedAmount: (name: string, amount: number) => `✅ ${amount.toLocaleString()} IQD debt cleared from ${name}.`,
  debtClearedNotify: "✅ قەرزەکەت سڕایەوە! ئێستا هیچ قەرزێکت نییە.",
  debtClearedNotifyAmount: (amount: number, remaining: number) => `✅ ${amount.toLocaleString()} دینار قەرز سڕایەوە لە هەژمارەکەت.${remaining <= 0 ? "\nئێستا هیچ قەرزێکت نییە." : `\n💰 قەرزی ماوە: ${remaining.toLocaleString()} دینار`}`,
  debtAdded: (name: string, amount: number) => `✅ ${amount.toLocaleString()} IQD debt added to ${name}.`,
  debtAddedNotify: (amount: number, total: number) => `📢 ${amount.toLocaleString()} دینار قەرز زیادکرا بە هەژمارەکەت.\n💰 کۆی قەرز: ${total.toLocaleString()} دینار`,
  debtLimitSet: (limit: number) => `✅ Debt limit set to ${limit > 0 ? limit.toLocaleString() + " IQD" : "Unlimited"}.`,
  revokeAccess: "🚫 Revoke Access",
  revokeConfirm: (name: string) => `⚠️ Are you sure you want to revoke access for "${name}"?\n\nThis user will no longer be able to use the bot.`,
  revokeYes: "🚫 Yes, Revoke",
  accessRevoked: "✅ User access revoked.",
  accessRevokedNotify: "🚫 دەستگەیشتنت لە بۆتەکە لابرا. تۆ چیتر ناتوانیت بۆتەکە بەکاربهێنیت.",
  noUsers: "No users found.",

  // Approval
  requestLimitReached: "⚠️ تۆ بە زۆری داواکاریت ناردووە ئەمڕۆ. تکایە سبەی هەوڵبدەرەوە.",
  pendingApproval: "⏳ داواکاریت بۆ بەکارهێنانی بۆتەکە نێردرا.\nتکایە چاوەڕوان بە تا ئەدمین پەسەندت بکات.",
  newUserRequest: (userId: number, name: string, username: string | undefined) =>
    `🆕 New user request:\n\n👤 Name: ${name}\n🆔 ID: ${userId}${username ? `\n📧 @${username}` : ""}\n\nApprove?`,
  approved: "✅ پەسەندکرایت! ئێستا دەتوانیت بۆتەکە بەکاربهێنیت.\n/start بنووسە بۆ دەستپێکردن.",
  rejected: "❌ داواکاریت ڕەتکرایەوە.",
  userApproved: "✅ User approved.",
  userRejected: "✅ User rejected.",
  approveUsers: "👥 Approve Users",

  // Errors
  notAdmin: "❌ You are not an admin.",
  cancelled: "Cancelled.",
  cancel: "❌ Cancel",
};
