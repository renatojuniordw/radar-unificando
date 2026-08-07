import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  lazyConnect: true,
});

let redisConnected = false;

export function isRedisReady(): boolean {
  return redisConnected && redisClient.status === 'ready';
}

redisClient
  .connect()
  .then(() => {
    redisConnected = true;
    console.log('[Redis] Conectado com sucesso.');
  })
  .catch((err) => {
    redisConnected = false;
    console.warn('[Redis] Indisponível, utilizando fallback em memória:', err.message);
  });

redisClient.on('error', (err) => {
  redisConnected = false;
  console.warn('[Redis] Erro no client:', err.message);
});
