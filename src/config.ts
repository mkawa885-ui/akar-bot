import dotenv from "dotenv";
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || "",
  adminIds: (process.env.ADMIN_IDS || "").split(",").map((id) => parseInt(id.trim())),
  supportUsername: process.env.SUPPORT_USERNAME || "support",
};

export function isAdmin(telegramId: number): boolean {
  return config.adminIds.includes(telegramId);
}
