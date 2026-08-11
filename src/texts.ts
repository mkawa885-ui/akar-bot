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
  productDetails: (title: string, desc: string, price: number, vipPrice: number | null, stock: number, category: string, role: string) =>
    `📦 بەرهەم: ${title}\n📂 بەش: ${category}\n\n📝 وەسف:\n${desc}\n\n💰 نرخ: ${price.toLocaleString()} دینار${vipPrice != null ? `\n👑 نرخی VIP: ${vipPrice.toLocaleString()} دینار` : ""}${role === "vip" && vipPrice != null ? `\n✨ تۆ VIP یت — نرخی تۆ: ${vipPrice.toLocaleString()} دینار` : ""}\n🟢 ئامادە: ${stock} دانە`,
  outOfStock: "❌ ئەم بەرهەمە بەردەست نییە.",
  buy: "🛒 بیکڕە",
  back: "🔙 گەڕانەوە",

  // Purchase
  purchaseSuccess: (content: string) =>
    `✅ کڕینەکەت سەرکەوتوو بوو!\n\n🔑 ئەمە بەرهەمەکەتە:\n\n<code>${content}</code>\n\nسوپاس بۆ کڕینەکەت! 🙏`,
  purchaseManualSuccess: "✅ داواکاریەکەت تۆمارکرا!\n\n⏳ بەرهەمەکەت ئامادە دەکرێت و بۆت دەنێردرێت.\nتکایە چاوەڕوان بە.",
  manualOrderNotify: (orderId: number, name: string, username: string | undefined, productTitle: string, category: string, price: number) =>
    `🔔 داواکاریی دەستی!\n\n📋 داواکاری #${orderId}\n👤 ${name}${username ? ` (@${username})` : ""}\n📦 ${category} > ${productTitle}\n💰 نرخ: ${price.toLocaleString()} دینار\n\nتکایە بەرهەمەکە ئامادە بکە و بینێرە.`,
  deliverOrder: "📬 گەیاندن",
  enterDeliveryContent: "ناوەرۆکی بەرهەمەکە بنووسە بۆ ناردن بۆ کڕیار:",
  orderDelivered: "✅ بەرهەمەکە نێردرا بۆ کڕیار!",
  orderDeliveredNotify: (content: string) =>
    `✅ بەرهەمەکەت ئامادەیە!\n\n🔑 ئەمە بەرهەمەکەتە:\n\n<code>${content}</code>\n\nسوپاس! 🙏`,
  pendingOrders: "📬 داواکارییە چاوەڕوانەکان",
  noPendingOrders: "هیچ داواکارییەکی چاوەڕوان نییە.",
  toggleProduct: "🔄 چالاک/ناچالاک کردنی بەرهەم",
  selectProductToToggle: "بەرهەمێک هەڵبژێرە بۆ چالاک/ناچالاککردن:",
  productEnabled: (title: string) => `✅ "${title}" چالاککرا — کڕیاران دەتوانن بیکڕن.`,
  productDisabled: (title: string) => `🚫 "${title}" ناچالاککرا — کڕیاران ناتوانن بیکڕن.`,
  productUnavailable: "🚫 ئەم بەرهەمە لە ئێستادا بەردەست نییە.",
  lowStockAlert: (title: string, remaining: number) =>
    `⚠️ ستۆکی "${title}" کەمە!\n\n📦 ماوە: ${remaining} دانە\nتکایە ستۆک زیادبکە.`,
  purchaseFailed: "❌ کڕینەکە سەرنەکەوت. تکایە دواتر هەوڵبدەرەوە.",
  orderNotifyAdmin: (name: string, username: string | undefined, productTitle: string, category: string, price: number, debt: number) =>
    `🛒 داواکاریی نوێ!\n\n👤 ${name}${username ? ` (@${username})` : ""}\n📦 ${category} > ${productTitle}\n💰 نرخ: ${price.toLocaleString()} دینار\n💳 کۆی قەرز: ${debt.toLocaleString()} دینار`,

  // Orders
  noOrders: "هیچ داواکارییەکت نییە تا ئێستا.",
  orderItem: (id: number, title: string, date: string) =>
    `📦 #${id} - ${title}\n📅 ${date}`,

  // Support
  supportMessage: (username: string) =>
    `💬 بۆ پشتگیری پەیوەندی بکە بە:\n@${username}`,

  // Admin
  adminWelcome: "بەخێربێیت بۆ پانێڵی ئەدمین ⚙️",
  addCategory: "📁 زیادکردنی بەش",
  addProduct: "📦 زیادکردنی بەرهەم",
  addStock: "🔑 زیادکردنی ئامادەیی (ستۆک)",
  deleteCategory: "🗑️ سڕینەوەی بەش",
  deleteStock: "🗑️ سڕینەوەی ستۆک",
  deleteProduct: "🗑️ سڕینەوەی بەرهەم",
  manageUsers: "👥 بەڕێوەبردنی بەکارهێنەران",
  searchStock: "🔍 گەڕان لە ستۆک",
  enterSearchQuery: "ئیمەیڵ یان بەشێک لە ناوەرۆکی ئەکاونتەکە بنووسە بۆ گەڕان:",
  searchResults: (query: string, count: number) => `🔍 ئەنجامی گەڕان بۆ "${query}": ${count} دانە`,
  noSearchResults: (query: string) => `❌ هیچ ئەنجامێک نەدۆزرایەوە بۆ "${query}"`,
  stockSold: "🔴 فرۆشراو",
  stockAvailable: "🟢 ئامادە",
  inventory: "📋 ستۆک و ئامادەیی",
  stats: "📊 ئامارەکان",
  exportDb: "💾 ئێکسپۆرتی داتابەیس",
  exportDbSending: "⏳ داتابەیسەکە دەنێردرێت...",
  restoreDb: "📥 گەڕاندنەوەی داتابەیس",
  restoreDbPrompt: "فایلی داتابەیسەکە بنێرە (.db یان .json)\n\n⚠️ ئاگاداربە: ئەمە هەموو داتاکانی ئێستا دەگۆڕێت!",
  restoreSuccess: "✅ داتابەیسەکە بە سەرکەوتوویی گەڕێنرایەوە!",
  restoreFailed: "❌ گەڕاندنەوەکە سەرنەکەوت. تکایە فایلێکی دروست بنێرە.",
  restoreInvalidFile: "❌ تکایە فایلێکی .json بنێرە.",
  broadcast: "📢 نامە بۆ هەمووان",

  // Admin prompts
  enterCategoryName: "ناوی بەشەکە بنووسە:",
  categoryAdded: "✅ بەشەکە زیادکرا!",
  selectCategoryForProduct: "بەشێک هەڵبژێرە بۆ بەرهەمەکە:",
  enterProductTitle: "ناوی بەرهەمەکە بنووسە:",
  enterProductDescription: "وەسفی بەرهەمەکە بنووسە:",
  enterVipPrice: "نرخی VIP بنووسە (بە ژمارە بە دینار، 0 بۆ بێ نرخی VIP):",
  selectDeliveryType: "جۆری گەیاندن هەڵبژێرە:",
  autoDelivery: "⚡ خۆکارانە (لە ستۆک)",
  manualDelivery: "✋ دەستی (ئامادەکردن)",
  enterProductPrice: "نرخی بەرهەمەکە بنووسە (بە ژمارە):",
  invalidPrice: "❌ تکایە ژمارەیەکی دروست بنووسە.",
  productAdded: "✅ بەرهەمەکە زیادکرا!",
  selectProductForStock: "بەرهەمێک هەڵبژێرە بۆ زیادکردنی ستۆک:",
  enterStockItems: "ئامادەییەکان (ستۆک) بنووسە، هەر دانەیەک لە دێڕێکی جیا:\n\nبۆ نموونە:\nemail@mail.com:pass123\nemail2@mail.com:pass456",
  stockAdded: (count: number) => `✅ ${count} دانە ستۆک زیادکرا!`,
  selectCategoryToDelete: "بەشێک هەڵبژێرە بۆ سڕینەوە:",
  categoryDeleted: "✅ بەشەکە سڕایەوە!",
  selectProductForStockDelete: "بەرهەمێک هەڵبژێرە بۆ سڕینەوەی ستۆک:",
  stockDeleteOptions: (title: string, available: number) => `🗑️ سڕینەوەی ستۆکی "${title}"\n\n🟢 ئامادە: ${available} دانە\n\nچی بسڕێتەوە؟`,
  deleteAllStock: "🗑️ هەموو ستۆک بسڕەوە",
  deleteUnsoldStock: "🗑️ تەنها نەفرۆشراوەکان",
  stockDeleted: (count: number) => `✅ ${count} دانە ستۆک سڕایەوە!`,
  selectProductToDelete: "بەرهەمێک هەڵبژێرە بۆ سڕینەوە:",
  productDeleted: "✅ بەرهەمەکە سڕایەوە!",
  enterBroadcast: "نامەکە بنووسە کە بۆ هەموو بەکارهێنەران دەنێردرێت:",
  broadcastSent: (count: number) => `✅ نامەکە نێردرا بۆ ${count} کەس.`,
  broadcastFailed: "❌ نامەکە نەنێردرا.",
  statsMessage: (users: number, products: number, orders: number, stock: number) =>
    `📊 ئامارەکان:\n\n👥 بەکارهێنەران: ${users}\n📦 بەرهەمەکان: ${products}\n🛒 داواکارییەکان: ${orders}\n🔑 ستۆکی ئامادە: ${stock}`,

  // Account
  accountInfo: (debt: number, orderCount: number, limit: number, role: string) =>
    `👤 هەژمارەکەم\n\n${role === "vip" ? "👑 VIP" : "📋 Standard"}\n💰 قەرز: ${debt.toLocaleString()} دینار\n📦 کۆی داواکارییەکان: ${orderCount}\n🔒 سنووری قەرز: ${limit > 0 ? limit.toLocaleString() + " دینار" : "نادیار"}`,
  noDebt: "✅ هیچ قەرزێکت نییە!",
  debtLimitReached: "❌ تۆ گەیشتویت بە سنووری قەرزەکەت. تکایە قەرزەکەت بسڕەوە پێش کڕینی نوێ.",

  // User management
  userListTitle: "👥 بەکارهێنەران:",
  userDetail: (name: string, username: string | null, debt: number, orders: number, limit: number, role: string) =>
    `👤 ${name}${username ? ` (@${username})` : ""}\n${role === "vip" ? "👑 VIP" : "📋 Standard"}\n\n💰 قەرز: ${debt.toLocaleString()} دینار\n📦 داواکارییەکان: ${orders}\n🔒 سنووری قەرز: ${limit > 0 ? limit.toLocaleString() + " دینار" : "نادیار"}`,
  setRole: "👑 گۆڕینی ڕۆڵ",
  roleStandard: "📋 Standard",
  roleVip: "👑 VIP",
  roleChanged: (role: string) => `✅ ڕۆڵی بەکارهێنەر گۆڕدرا بۆ ${role === "vip" ? "👑 VIP" : "📋 Standard"}`,
  roleChangedNotify: (role: string) => role === "vip"
    ? "👑 ڕۆڵەکەت گۆڕدرا بۆ VIP! ئێستا نرخی VIP بۆت دەردەکەوێت."
    : "📋 ڕۆڵەکەت گۆڕدرا بۆ Standard.",
  clearDebt: "🧹 سڕینەوەی قەرز",
  addDebt: "➕ زیادکردنی قەرز",
  setDebtLimit: "🔒 دانانی سنووری قەرز",
  enterDebtAmount: "بڕی قەرزەکە بنووسە (بە ژمارە بە دینار):",
  enterDebtLimit: "سنووری قەرزەکە بنووسە (بە ژمارە بە دینار، 0 بۆ بێسنوور):",
  debtCleared: "✅ قەرزەکە سڕایەوە!",
  debtClearedNotify: "✅ قەرزەکەت سڕایەوە! ئێستا هیچ قەرزێکت نییە.",
  debtAdded: (amount: number) => `✅ ${amount.toLocaleString()} دینار قەرز زیادکرا.`,
  debtAddedNotify: (amount: number, total: number) => `📢 ${amount.toLocaleString()} دینار قەرز زیادکرا بە هەژمارەکەت.\n💰 کۆی قەرز: ${total.toLocaleString()} دینار`,
  debtLimitSet: (limit: number) => `✅ سنووری قەرز دانرا بە ${limit > 0 ? limit.toLocaleString() + " دینار" : "بێسنوور"}.`,
  noUsers: "هیچ بەکارهێنەرێک نییە.",

  // Approval
  pendingApproval: "⏳ داواکاریت بۆ بەکارهێنانی بۆتەکە نێردرا.\nتکایە چاوەڕوان بە تا ئەدمین پەسەندت بکات.",
  newUserRequest: (userId: number, name: string, username: string | undefined) =>
    `🆕 بەکارهێنەرێکی نوێ داوای بەکارهێنان دەکات:\n\n👤 ناو: ${name}\n🆔 ئایدی: ${userId}${username ? `\n📧 @${username}` : ""}\n\nپەسەندی دەکەیت؟`,
  approved: "✅ پەسەندکرایت! ئێستا دەتوانیت بۆتەکە بەکاربهێنیت.\n/start بنووسە بۆ دەستپێکردن.",
  rejected: "❌ داواکاریت ڕەتکرایەوە.",
  userApproved: "✅ بەکارهێنەرەکە پەسەندکرا.",
  userRejected: "✅ بەکارهێنەرەکە ڕەتکرایەوە.",
  approveUsers: "👥 پەسەندکردنی بەکارهێنەران",

  // Errors
  notAdmin: "❌ تۆ ئەدمین نیت.",
  cancelled: "هەڵوەشێنرایەوە.",
  cancel: "❌ هەڵوەشاندنەوە",
};
