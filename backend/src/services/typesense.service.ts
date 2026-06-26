import { Client as TypesenseClient } from 'typesense';
import logger from '../utils/logger';

const PROFILES_SCHEMA = {
  name: 'profiles',
  fields: [
    { name: 'id',           type: 'string'   as const },
    { name: 'fullName',     type: 'string'   as const },
    { name: 'username',     type: 'string'   as const },
    { name: 'profession',   type: 'string'   as const, optional: true },
    { name: 'location',     type: 'string'   as const, optional: true },
    { name: 'bio',          type: 'string'   as const, optional: true },
    { name: 'services',     type: 'string[]' as const, optional: true },
    { name: 'avatarUrl',    type: 'string'   as const, optional: true },
    { name: 'theme',        type: 'string'   as const, optional: true },
    { name: 'profileViews', type: 'int32'    as const, optional: true },
    { name: 'isPublished',  type: 'bool'     as const },
    { name: 'createdAt',    type: 'int64'    as const },
  ],
  default_sorting_field: 'profileViews',
};

const POSTS_SCHEMA = {
  name: 'posts',
  fields: [
    { name: 'id',         type: 'string'   as const },
    { name: 'content',    type: 'string'   as const },
    { name: 'postType',   type: 'string'   as const },
    { name: 'authorId',   type: 'string'   as const },
    { name: 'authorName', type: 'string'   as const, optional: true },
    { name: 'profession', type: 'string'   as const, optional: true },
    { name: 'location',   type: 'string'   as const, optional: true },
    { name: 'images',     type: 'string[]' as const, optional: true },
    { name: 'likesCount', type: 'int32'    as const },
    { name: 'status',     type: 'string'   as const },
    { name: 'createdAt',  type: 'int64'    as const },
  ],
  default_sorting_field: 'createdAt',
};

class TypesenseService {
  private client: TypesenseClient;

  constructor() {
    this.client = new TypesenseClient({
      nodes: [{
        host:     process.env.TYPESENSE_HOST     || 'localhost',
        port:     parseInt(process.env.TYPESENSE_PORT || '8108'),
        protocol: process.env.TYPESENSE_PROTOCOL || 'http',
      }],
      apiKey:                   process.env.TYPESENSE_ADMIN_API_KEY || 'xyz',
      connectionTimeoutSeconds: 5,
      retryIntervalSeconds:     0.1,
      numRetries:               2,
    });
  }

  /**
   * Circuit breaker. Flips to false when Typesense is disabled, unconfigured or
   * unreachable, so we stop hammering it (and flooding the logs) on every write.
   * Re-checked on process restart. Set `TYPESENSE_ENABLED=false` to opt out.
   */
  private available = process.env.TYPESENSE_ENABLED !== 'false';

  isAvailable = (): boolean => this.available;

  private disable = (reason: string): void => {
    if (!this.available) return;
    this.available = false;
    logger.warn(`Typesense disabled — ${reason}; search indexing is off until restart`);
  };

  /** Network/DNS failures mean the server is unreachable, not a bad document. */
  private isConnError = (e: any): boolean => {
    const code = e?.code ?? e?.cause?.code ?? '';
    const msg = String(e?.message ?? e);
    return (
      ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code) ||
      /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|getaddrinfo|connect ECONN/i.test(msg)
    );
  };

  /** Shared catch handler for write ops: self-disable on connection loss. */
  private onWriteError = (label: string, e: unknown): void => {
    if (this.isConnError(e)) this.disable('connection error');
    else logger.warn(`Typesense ${label} failed`, { error: e });
  };

  upsertProfile = async (profile: Record<string, any>): Promise<void> => {
    if (!this.available) return;
    try {
      await this.client.collections('profiles').documents().upsert(profile);
    } catch (e) {
      this.onWriteError('upsertProfile', e);
    }
  };

  updateProfile = (id: string, data: Record<string, any>): void => {
    if (!this.available) return;
    this.client.collections('profiles').documents().upsert({ id, ...data }).catch((e: unknown) => {
      this.onWriteError('updateProfile', e);
    });
  };

  removeProfile = async (id: string): Promise<void> => {
    if (!this.available) return;
    try {
      await this.client.collections('profiles').documents(id).delete();
    } catch (e) {
      this.onWriteError('removeProfile', e);
    }
  };

  searchProfiles = async (
    q: string,
    location?: string,
    profession?: string,
    page = 1,
  ): Promise<{ hits: any[]; total: number }> => {
    if (!this.available) return { hits: [], total: 0 };
    try {
      const filters: string[] = ['isPublished:=true'];
      if (profession) filters.push(`profession:=${profession}`);
      if (location)   filters.push(`location:=${location}`);

      const result = await this.client.collections('profiles').documents().search({
        q:         q || '*',
        query_by:  'fullName,profession,location,services,bio',
        filter_by: filters.join(' && '),
        per_page:  20,
        page,
        sort_by:   'profileViews:desc',
      });

      return {
        hits:  result.hits?.map((h: any) => h.document) ?? [],
        total: result.found ?? 0,
      };
    } catch (e) {
      logger.warn('Typesense searchProfiles failed', { error: e });
      return { hits: [], total: 0 };
    }
  };

  upsertPost = async (post: Record<string, any>): Promise<void> => {
    if (!this.available) return;
    try {
      await this.client.collections('posts').documents().upsert(post);
    } catch (e) {
      this.onWriteError('upsertPost', e);
    }
  };

  updatePost = (id: string, data: Record<string, any>): void => {
    if (!this.available) return;
    this.client.collections('posts').documents().upsert({ id, ...data }).catch((e: unknown) => {
      this.onWriteError('updatePost', e);
    });
  };

  removePost = async (id: string): Promise<void> => {
    if (!this.available) return;
    try {
      await this.client.collections('posts').documents(id).delete();
    } catch (e) {
      this.onWriteError('removePost', e);
    }
  };

  searchPosts = async (
    q: string,
    postType?: string,
    page = 1,
  ): Promise<{ hits: any[]; total: number }> => {
    if (!this.available) return { hits: [], total: 0 };
    try {
      const filters: string[] = ['status:=PUBLISHED'];
      if (postType && postType !== 'all') filters.push(`postType:=${postType.toUpperCase()}`);

      const result = await this.client.collections('posts').documents().search({
        q:         q || '*',
        query_by:  'content,authorName,profession,location',
        filter_by: filters.join(' && '),
        per_page:  20,
        page,
        sort_by:   'createdAt:desc',
      });

      return {
        hits:  result.hits?.map((h: any) => h.document) ?? [],
        total: result.found ?? 0,
      };
    } catch (e) {
      logger.warn('Typesense searchPosts failed', { error: e });
      return { hits: [], total: 0 };
    }
  };

  getFeed = async (opts: {
    type?:       string;
    page:        number;
    limit:       number;
    profession?: string;
    location?:   string;
  }): Promise<{ ids: string[]; total: number }> => {
    if (!this.available) return { ids: [], total: 0 };
    try {
      const { type, page, limit, profession, location } = opts;
      const filters: string[] = ['status:=PUBLISHED'];
      if (type && type !== 'all')         filters.push(`postType:=${type.toUpperCase()}`);
      if (profession && profession !== 'all') filters.push(`profession:=${profession}`);
      if (location?.trim())               filters.push(`location:=${location.trim()}`);

      const result = await this.client.collections('posts').documents().search({
        q:         '*',
        query_by:  'content',
        filter_by: filters.join(' && '),
        sort_by:   'createdAt:desc',
        per_page:  limit,
        page,
      });

      const ids = result.hits?.map((h: any) => h.document.id as string) ?? [];
      return { ids, total: result.found ?? 0 };
    } catch (e) {
      logger.warn('Typesense getFeed failed', { error: e });
      return { ids: [], total: 0 };
    }
  };

  setup = async (): Promise<void> => {
    if (!this.available) {
      logger.info('Typesense disabled (TYPESENSE_ENABLED=false) — skipping setup');
      return;
    }
    const health: any = await this.client.health
      .retrieve()
      .catch((e) => ({ ok: false, _err: e }));
    if (!health?.ok) {
      this.disable(
        this.isConnError(health?._err) ? 'unreachable' : 'health check not ok',
      );
      return;
    }
    try {
      await this._ensureCollection('profiles', PROFILES_SCHEMA);
      await this._ensureCollection('posts', POSTS_SCHEMA);
      await this._printSearchKey();
      logger.info('Typesense setup complete');
    } catch (e) {
      this.onWriteError('setup', e);
    }
  };

  documentCount = async (collection: string): Promise<number> => {
    if (!this.available) return 0;
    try {
      const info: any = await this.client.collections(collection).retrieve();
      return info?.num_documents ?? 0;
    } catch {
      return 0;
    }
  };

  health = async (): Promise<object> => {
    try {
      return await this.client.health.retrieve();
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  };

  private _ensureCollection = async (name: string, schema: object): Promise<void> => {
    try {
      await this.client.collections(name).retrieve();
    } catch (e: any) {
      if (e?.httpStatus === 404 || e?.message?.includes('not found')) {
        await this.client.collections().create(schema as any);
        logger.info(`Typesense collection created: ${name}`);
      } else {
        throw e;
      }
    }
  };

  private _printSearchKey = async (): Promise<void> => {
    try {
      const keys = await this.client.keys().retrieve();
      const existing = (keys.keys ?? []).find((k: any) => k.description === 'fundi-search-only');
      if (existing) return;

      const key = await this.client.keys().create({
        description: 'fundi-search-only',
        actions:     ['documents:search'],
        collections: ['*'],
      });
      console.log('\n========================================');
      console.log('Typesense search-only key (copy to NEXT_PUBLIC_TYPESENSE_SEARCH_KEY):');
      console.log(key.value);
      console.log('========================================\n');
    } catch (e) {
      logger.warn('Typesense: could not generate search-only key', { error: e });
    }
  };
}

export default new TypesenseService();
