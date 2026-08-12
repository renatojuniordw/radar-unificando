import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient, isRedisReady } from '@/lib/infrastructure/redis/client';

export type RateLimitProfile = 'chat' | 'chat_daily' | 'auth' | 'general' | 'register_daily' | 'extension' | 'resume_daily' | 'ats_daily';

interface RateLimitConfig {
  points: number;
  duration: number;
  keyPrefix: string;
}

/** Configuração centralizada de todos os perfis de rate limiting. */
const RATE_LIMIT_PROFILES: Record<RateLimitProfile, RateLimitConfig> = {
  chat:           { points: 10,  duration: 60,    keyPrefix: 'rl_chat' },
  chat_daily:     { points: 50,  duration: 86400, keyPrefix: 'rl_chat_daily' },
  auth:           { points: 5,   duration: 60,    keyPrefix: 'rl_auth' },
  general:        { points: 60,  duration: 60,    keyPrefix: 'rl_general' },
  register_daily: { points: 3,   duration: 86400, keyPrefix: 'rl_register_daily' },
  extension:      { points: 20,  duration: 60,    keyPrefix: 'rl_extension' },
  resume_daily:   { points: 10,  duration: 86400, keyPrefix: 'rl_resume_daily' },
  ats_daily:      { points: 10,  duration: 86400, keyPrefix: 'rl_ats_daily' },
};

/** Cria limiters em memória (fallback fail-safe) a partir da config. */
const memoryLimiters = new Map<RateLimitProfile, RateLimiterMemory>(
  Object.entries(RATE_LIMIT_PROFILES).map(([profile, cfg]) => [
    profile as RateLimitProfile,
    new RateLimiterMemory({ points: cfg.points, duration: cfg.duration }),
  ]),
);

/** Cria limiters Redis a partir da config (só se Redis estiver disponível). */
const redisLimiters = new Map<RateLimitProfile, RateLimiterRedis>();

if (redisClient) {
  for (const [profile, cfg] of Object.entries(RATE_LIMIT_PROFILES)) {
    redisLimiters.set(
      profile as RateLimitProfile,
      new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: cfg.keyPrefix,
        points: cfg.points,
        duration: cfg.duration,
      }),
    );
  }
}

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

  const useRedis = isRedisReady() && redisClient;
  const limiterToUse = useRedis
    ? redisLimiters.get(profile)!
    : memoryLimiters.get(profile)!;

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
