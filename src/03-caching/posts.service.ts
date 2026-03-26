import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_TTL = 300; // 5 minutos em segundos

function cacheKey(id: number): string {
  return `cache:post:${id}`;
}

export interface CreatePostDto {
  title: string;
  content: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findOne(id: number) {
    const key = cacheKey(id);

    // 1. Tenta o Redis primeiro
    const cached = await this.redis.get(key);
    if (cached) {
      console.log(`[CACHE HIT] post:${id}`);
      return JSON.parse(cached); // Redis guarda string → converte de volta pra objeto
    }

    // 2. MISS: busca no Postgres
    console.log(`[CACHE MISS] post:${id}`);
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post ${id} não encontrado`);
    }

    // 3. Salva no Redis com TTL
    await this.redis.setWithTTL(key, JSON.stringify(post), CACHE_TTL);

    return post;
  }

  async update(id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.update({
      where: { id },
      data: dto,
    });

    await this.redis.del(cacheKey(id));
    console.log(`[cache invalidated] post:${id}`);

    return post;
  }

  async remove(id: number) {
    await this.prisma.post.delete({ where: { id } });
    await this.redis.del(cacheKey(id));
  }

  async findAll() {
    return this.prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreatePostDto) {
    return this.prisma.post.create({ data: dto });
  }
}
