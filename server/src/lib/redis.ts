import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

client.on("error", (err) => console.error("[redis]", err));

export const connectRedis = () =>
  client.connect().catch((err) => console.error("[redis] Failed to connect:", err));

export const getCache = async (key: string): Promise<string | null> => {
  if (!client.isReady) return null;
  return client.get(key).catch(() => null);
};

export const setCache = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  if (!client.isReady) return;
  await client.set(key, value, { EX: ttlSeconds }).catch(() => null);
};

export const delCache = async (key: string): Promise<void> => {
  if (!client.isReady) return;
  await client.del(key).catch(() => null);
};
