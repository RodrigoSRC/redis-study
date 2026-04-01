/**
 * FASE 2 — Conexão Redis no NestJS
 *
 * Objetivo: fazer o código TypeScript falar com o Redis via ioredis.
 *
 * O código real desta fase NÃO fica em uma pasta numerada — fica em src/redis/
 * porque é infraestrutura global reutilizada por todas as fases seguintes
 * (cache, sessions, pub/sub, queues...), não um feature isolado.
 *
 * Arquivos criados:
 *   src/redis/redis.module.ts      — módulo global, importado uma vez no AppModule
 *   src/redis/redis.service.ts     — abstração dos comandos ioredis
 *   src/redis/redis.controller.ts  — endpoints temporários só para testar a conexão
 */

// ---------------------------------------------------------------------------
// ESTRUTURA: por que separar module, service e controller?
//
// redis.module.ts
//   Responsabilidade: registrar e exportar o RedisService no sistema de DI do NestJS.
//   @Global() faz com que qualquer outro módulo possa injetar RedisService
//   sem precisar importar RedisModule explicitamente — igual ao PrismaModule.
//
// redis.service.ts
//   Responsabilidade: encapsular o client ioredis.
//   Outros serviços nunca tocam no ioredis diretamente — só usam os métodos
//   expostos aqui. Isso facilita trocar a lib (ex: node-redis) sem mudar o resto.
//
// redis.controller.ts
//   Responsabilidade: testar visualmente que a conexão funciona.
//   Temporário — pode ser removido após confirmar que o RedisInsight mostra as chaves.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CONEXÃO: como o ioredis se conecta ao Redis
//
//   this.client = new Redis({
//     host: process.env.REDIS_HOST ?? 'localhost',
//     port: Number(process.env.REDIS_PORT ?? 6379),
//   });
//
// - O construtor abre a conexão TCP assim que o módulo é inicializado.
// - process.env lê as variáveis do .env (REDIS_HOST, REDIS_PORT).
// - ?? 'localhost' é o fallback caso a variável não esteja definida.
// - Number() converte string para number — process.env sempre retorna string,
//   mas o ioredis precisa de number na porta.
// - OnModuleDestroy fecha a conexão quando a aplicação encerra, evitando leak.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CONCEITO CENTRAL: Redis só armazena strings
//
// Diferente do Postgres, o Redis não tem tipos complexos (objeto, array, etc.).
// Tudo que entra precisa ser string. Então para guardar um objeto JS:
//
//   SALVAR → JSON.stringify() converte objeto para string antes de enviar
//   LER    → JSON.parse() converte a string de volta para objeto ao retornar
//
// Exemplo:
//
//   const post = { id: 1, title: 'Olá Redis' };
//
//   await redis.setWithTTL('cache:post:1', JSON.stringify(post), 300);
//   // O Redis recebe a string: '{"id":1,"title":"Olá Redis"}'
//
//   const raw = await redis.get('cache:post:1'); // string | null
//   const cached = raw ? JSON.parse(raw) : null; // objeto ou null
//
// raw pode ser null se a chave não existe ou o TTL expirou.
// JSON.parse(null) lança exceção — por isso sempre checamos antes de parsear.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// MÉTODOS DO RedisService e seus equivalentes no CLI da Fase 1
//
//   set(key, value)
//     → SET key value
//     → Salva sem expiração. Fica no Redis até ser deletado manualmente.
//
//   setWithTTL(key, value, ttlSeconds)
//     → SET key value EX 300
//     → Salva com expiração automática. Usado em cache, sessions, rate limiting.
//
//   get(key)
//     → GET key
//     → Lê o valor. Retorna null se não existe ou expirou.
//
//   del(key)
//     → DEL key
//     → Remove a chave imediatamente. Usado para invalidar cache após update/delete.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TESTE REALIZADO ✓
//
//   POST /redis/test
//     → gravou JSON.stringify({ msg: 'Hello Redis!' }) com TTL de 60s
//     → retornou { written: true }
//
//   GET /redis/test
//     → leu a string do Redis, fez JSON.parse, retornou { msg: 'Hello Redis!' }
//
//   RedisInsight (http://localhost:5540) mostrou a chave test:key com TTL decrescendo.
// ---------------------------------------------------------------------------
