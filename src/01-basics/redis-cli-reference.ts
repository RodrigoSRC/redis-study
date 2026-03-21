/**
 * FASE 1 — Redis CLI Reference
 *
 * Exploração dos tipos de dados nativos do Redis via redis-cli.
 * Nenhuma abstração de ORM ou driver — comandos diretos ao servidor Redis.
 *
 * Acesso ao CLI:
 *   docker exec -it redis-study-redis-1 redis-cli
 */

// ---------------------------------------------------------------------------
// STRINGS
// Tipo mais básico. Armazena qualquer valor escalar: texto, número, JSON, flag.
// ---------------------------------------------------------------------------
export const STRING_COMMANDS = {
  /** Grava um valor */
  SET: 'SET usuario:1 "João"',

  /** Lê um valor */
  GET: 'GET usuario:1',

  /** Define expiração em segundos (Time To Live) */
  EXPIRE: 'EXPIRE usuario:1 60',

  /** Consulta quantos segundos restam (-1 = sem TTL, -2 = chave inexistente) */
  TTL: 'TTL usuario:1',

  /** Remove a chave */
  DEL: 'DEL usuario:1',

  /** Verifica existência (retorna 1 ou 0) */
  EXISTS: 'EXISTS usuario:1',

  /** Incrementa atomicamente (útil para contadores e rate limiting) */
  INCR: 'INCR visitas:pagina:home',

  /** Grava e define TTL em um único comando */
  SETEX: 'SETEX session:abc123 86400 "{userId:1,role:admin}"',
} as const;

// ---------------------------------------------------------------------------
// HASHES
// Mapa de campo→valor dentro de uma única chave. Equivale a um objeto JS.
// Vantagem sobre String+JSON: atualizar um campo não reescreve o objeto inteiro.
// ---------------------------------------------------------------------------
export const HASH_COMMANDS = {
  /** Grava um ou mais campos */
  HSET: 'HSET produto:1 nome "Notebook" preco 3000 estoque 10',

  /** Lê um campo específico */
  HGET: 'HGET produto:1 nome',

  /** Lê todos os campos e valores */
  HGETALL: 'HGETALL produto:1',

  /** Remove um campo */
  HDEL: 'HDEL produto:1 estoque',

  /** Verifica se um campo existe */
  HEXISTS: 'HEXISTS produto:1 preco',

  /** Incrementa um campo numérico */
  HINCRBY: 'HINCRBY produto:1 estoque 5',
} as const;

// ---------------------------------------------------------------------------
// LISTS
// Lista ordenada com duplicatas (como Array). Suporta inserção nas duas pontas.
// Padrões: fila FIFO (RPUSH + LPOP) ou pilha LIFO (RPUSH + RPOP).
// ---------------------------------------------------------------------------
export const LIST_COMMANDS = {
  /** Insere no final (Right PUSH) */
  RPUSH: 'RPUSH fila:emails "email1@x.com" "email2@x.com"',

  /** Insere no início (Left PUSH) — alta prioridade */
  LPUSH: 'LPUSH fila:emails "urgente@x.com"',

  /** Lê sem remover (0 = início, -1 = fim da lista) */
  LRANGE: 'LRANGE fila:emails 0 -1',

  /** Remove e retorna o primeiro elemento (consumir fila FIFO) */
  LPOP: 'LPOP fila:emails',

  /** Remove e retorna o último elemento */
  RPOP: 'RPOP fila:emails',

  /** Tamanho da lista */
  LLEN: 'LLEN fila:emails',
} as const;

// ---------------------------------------------------------------------------
// SETS
// Conjunto de strings únicas sem ordem garantida.
// Não permite duplicatas — inserir o mesmo valor duas vezes é idempotente.
// ---------------------------------------------------------------------------
export const SET_COMMANDS = {
  /** Adiciona um ou mais membros */
  SADD: 'SADD tags:post:1 "nodejs" "redis" "typescript"',

  /** Lista todos os membros */
  SMEMBERS: 'SMEMBERS tags:post:1',

  /** Verifica se um membro existe (retorna 1 ou 0) */
  SISMEMBER: 'SISMEMBER tags:post:1 "redis"',

  /** Remove um membro */
  SREM: 'SREM tags:post:1 "nodejs"',

  /** Quantidade de membros */
  SCARD: 'SCARD tags:post:1',

  /** Interseção entre dois sets */
  SINTER: 'SINTER tags:post:1 tags:post:2',
} as const;

// ---------------------------------------------------------------------------
// SORTED SETS (ZSets)
// Como Set, mas cada membro possui um score numérico.
// O Redis mantém a ordem pelo score automaticamente.
// Caso de uso clássico: rankings, leaderboards, filas de prioridade.
// ---------------------------------------------------------------------------
export const SORTED_SET_COMMANDS = {
  /** Adiciona membros com seus scores */
  ZADD: 'ZADD ranking 100 "joao" 200 "maria" 150 "pedro"',

  /** Lista do menor para o maior score */
  ZRANGE: 'ZRANGE ranking 0 -1 WITHSCORES',

  /** Lista do maior para o menor score (top N) */
  ZREVRANGE: 'ZREVRANGE ranking 0 2 WITHSCORES',

  /** Posição de um membro (0-based, pelo score crescente) */
  ZRANK: 'ZRANK ranking "joao"',

  /** Incrementa o score de um membro */
  ZINCRBY: 'ZINCRBY ranking 50 "joao"',

  /** Score atual de um membro */
  ZSCORE: 'ZSCORE ranking "maria"',
} as const;

// ---------------------------------------------------------------------------
// COMANDOS GERAIS
// ---------------------------------------------------------------------------
export const GENERAL_COMMANDS = {
  /** Lista todas as chaves — NUNCA usar em produção (bloqueia o servidor) */
  KEYS_ALL: 'KEYS *',

  /** Iteração segura por cursor — usar em produção no lugar de KEYS */
  SCAN: 'SCAN 0 MATCH * COUNT 100',

  /** Inspeciona o tipo de uma chave: string | hash | list | set | zset */
  TYPE: 'TYPE usuario:1',

  /** Apaga TODAS as chaves do banco atual — apenas em ambiente de estudo */
  FLUSHDB: 'FLUSHDB',

  /** Verifica latência da conexão */
  PING: 'PING',

  /** Informações do servidor Redis */
  INFO: 'INFO server',
} as const;

// ---------------------------------------------------------------------------
// CONVENÇÃO DE NOMENCLATURA DE CHAVES
//
// Redis é schema-less, mas a convenção amplamente adotada é:
//   <entidade>:<id>:<campo_opcional>
//
// Exemplos:
//   usuario:42            → hash ou string de um usuário
//   cache:post:7          → cache do post com id 7
//   session:uuid-aqui     → sessão autenticada
//   rate:192.168.1.1      → contador de rate limit por IP
//   fila:emails           → lista usada como fila de e-mails
//   ranking               → sorted set de pontuação global
// ---------------------------------------------------------------------------
