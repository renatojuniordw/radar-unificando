import { redisClient } from '@/lib/infrastructure/redis/client';

const LOCK_TTL_SECONDS = 120;

export async function acquireChatLock(userId: string): Promise<boolean> {
  try {
    if (redisClient.status !== 'ready') return true; // fail-open sem Redis
    const ok = await redisClient.set(`chat_lock:${userId}`, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
    return ok === 'OK';
  } catch {
    return true; // fail-open: não derrubar o chat se o Redis falhar
  }
}

export async function releaseChatLock(userId: string): Promise<void> {
  try {
    if (redisClient.status === 'ready') await redisClient.del(`chat_lock:${userId}`);
  } catch {
    // best-effort
  }
}
