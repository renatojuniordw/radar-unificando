import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let redisClient: Redis | null = null;
let redisConnected = false;

// Tenta conectar ao Redis se estiver configurado
try {
  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    enableOfflineQueue: false, // Evita enfileiramento infinito em caso de queda do Redis
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    redisConnected = true;
    console.log('[RateLimit] Conectado ao Redis com sucesso.');
  }).catch((err) => {
    redisConnected = false;
    console.warn('[RateLimit] Redis indisponível, utilizando fallback em memória:', err.message);
  });

  redisClient.on('error', (err) => {
    redisConnected = false;
    console.warn('[RateLimit] Erro no Redis client:', err.message);
  });
} catch (error) {
  console.warn('[RateLimit] Falha ao inicializar o cliente Redis:', error);
}

// Fallback em memória para garantia de funcionamento (Fail-safe)
const memoryLimiterChat = new RateLimiterMemory({ points: 10, duration: 60 });
const memoryLimiterChatDaily = new RateLimiterMemory({ points: 50, duration: 86400 });
const memoryLimiterAuth = new RateLimiterMemory({ points: 5, duration: 60 });
const memoryLimiterGeneral = new RateLimiterMemory({ points: 60, duration: 60 });

// Rate Limiters no Redis
let redisLimiterChat: RateLimiterRedis | null = null;
let redisLimiterChatDaily: RateLimiterRedis | null = null;
let redisLimiterAuth: RateLimiterRedis | null = null;
let redisLimiterGeneral: RateLimiterRedis | null = null;

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
}

export type RateLimitProfile = 'chat' | 'chat_daily' | 'auth' | 'general';

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

  if (redisConnected && redisClient) {
    if (profile === 'chat') limiterToUse = redisLimiterChat!;
    else if (profile === 'chat_daily') limiterToUse = redisLimiterChatDaily!;
    else if (profile === 'auth') limiterToUse = redisLimiterAuth!;
    else limiterToUse = redisLimiterGeneral!;
  } else {
    // Usar fallback em memória
    if (profile === 'chat') limiterToUse = memoryLimiterChat;
    else if (profile === 'chat_daily') limiterToUse = memoryLimiterChatDaily;
    else if (profile === 'auth') limiterToUse = memoryLimiterAuth;
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
