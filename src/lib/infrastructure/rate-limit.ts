import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient, isRedisReady } from '@/lib/infrastructure/redis/client';

// Fallback em memória para garantia de funcionamento (Fail-safe)
const memoryLimiterChat = new RateLimiterMemory({ points: 10, duration: 60 });
const memoryLimiterChatDaily = new RateLimiterMemory({ points: 50, duration: 86400 });
const memoryLimiterAuth = new RateLimiterMemory({ points: 5, duration: 60 });
const memoryLimiterGeneral = new RateLimiterMemory({ points: 60, duration: 60 });
const memoryLimiterRegisterDaily = new RateLimiterMemory({ points: 3, duration: 86400 });
const memoryLimiterExtension = new RateLimiterMemory({ points: 20, duration: 60 });

// Rate Limiters no Redis
let redisLimiterChat: RateLimiterRedis | null = null;
let redisLimiterChatDaily: RateLimiterRedis | null = null;
let redisLimiterAuth: RateLimiterRedis | null = null;
let redisLimiterGeneral: RateLimiterRedis | null = null;
let redisLimiterRegisterDaily: RateLimiterRedis | null = null;
let redisLimiterExtension: RateLimiterRedis | null = null;

if (redisClient) {
  redisLimiterChat = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_chat',
    points: 10, // 10 requisições
    duration: 60, // por 60 segundos
  });

  redisLimiterChatDaily = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_chat_daily',
    points: 50, // 50 requisições por dia
    duration: 86400, // por 24 horas
  });

  redisLimiterAuth = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_auth',
    points: 5, // 5 requisições
    duration: 60, // por 60 segundos
  });

  redisLimiterGeneral = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_general',
    points: 60, // 60 requisições
    duration: 60, // por 60 segundos
  });

  redisLimiterRegisterDaily = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_register_daily',
    points: 3, // 3 cadastros por IP por dia
    duration: 86400, // por 24 horas
  });

  redisLimiterExtension = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_extension',
    points: 20, // 20 análises
    duration: 60, // por 60 segundos
  });
}

export type RateLimitProfile = 'chat' | 'chat_daily' | 'auth' | 'general' | 'register_daily' | 'extension';

export interface RateLimitResult {
  success: boolean;
  remainingPoints: number;
  msBeforeNext: number;
  consumedPoints: number;
}

/**
 * Verifica se uma requisição proveniente de determinado identificador (ex: IP ou userId:IP) excedeu o limite.
 * 
 * @param key Identificador do cliente (IP ou combinação userId:IP)
 * @param profile Tipo de perfil de limitação ('chat', 'chat_daily', 'auth', 'general')
 * @returns RateLimitResult contendo success, remainingPoints, msBeforeNext
 */
export async function checkRateLimit(
  key: string,
  profile: RateLimitProfile = 'general'
): Promise<RateLimitResult> {
  const cleanKey = key.split(',')[0].trim() || '127.0.0.1';

  let limiterToUse: RateLimiterRedis | RateLimiterMemory;

  if (isRedisReady() && redisClient) {
    if (profile === 'chat') limiterToUse = redisLimiterChat!;
    else if (profile === 'chat_daily') limiterToUse = redisLimiterChatDaily!;
    else if (profile === 'auth') limiterToUse = redisLimiterAuth!;
    else if (profile === 'register_daily') limiterToUse = redisLimiterRegisterDaily!;
    else if (profile === 'extension') limiterToUse = redisLimiterExtension!;
    else limiterToUse = redisLimiterGeneral!;
  } else {
    // Usar fallback em memória
    if (profile === 'chat') limiterToUse = memoryLimiterChat;
    else if (profile === 'chat_daily') limiterToUse = memoryLimiterChatDaily;
    else if (profile === 'auth') limiterToUse = memoryLimiterAuth;
    else if (profile === 'register_daily') limiterToUse = memoryLimiterRegisterDaily;
    else if (profile === 'extension') limiterToUse = memoryLimiterExtension;
    else limiterToUse = memoryLimiterGeneral;
  }

  try {
    const res: RateLimiterRes = await limiterToUse.consume(cleanKey);
    return {
      success: true,
      remainingPoints: res.remainingPoints,
      msBeforeNext: res.msBeforeNext,
      consumedPoints: res.consumedPoints,
    };
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      // Em caso de erro interno não previsto, libera a requisição (fail-open para disponibilidade)
      console.error('[RateLimit] Erro inesperado ao verificar rate limit:', rejRes);
      return {
        success: true,
        remainingPoints: 1,
        msBeforeNext: 0,
        consumedPoints: 1,
      };
    }

    const res = rejRes as RateLimiterRes;
    return {
      success: false,
      remainingPoints: res.remainingPoints || 0,
      msBeforeNext: res.msBeforeNext || 60000,
      consumedPoints: res.consumedPoints || 0,
    };
  }
}
