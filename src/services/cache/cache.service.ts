// src/services/cache/cache.service.ts
import { IDropdownOption } from "@fluentui/react";

interface CacheData {
  sistemas: IDropdownOption[];
  proyectosPorSistema: { [sistemaId: string]: IDropdownOption[] };
  tipos: IDropdownOption[];
  temas: IDropdownOption[];
  lastUpdate: number;
}

export class CacheService {
  private static instance: CacheService;
  private readonly CACHE_KEY = 'notion_cache';
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hora

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async getCache(): Promise<CacheData | null> {
    try {
      const cacheStr = localStorage.getItem(this.CACHE_KEY);
      if (!cacheStr) return null;

      const cache: CacheData = JSON.parse(cacheStr);
      
      // Verificar si el caché ha expirado
      if (Date.now() - cache.lastUpdate > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  async updateCache(data: Partial<Omit<CacheData, 'lastUpdate'>>): Promise<void> {
    try {
      const currentCache = await this.getCache() || {
        sistemas: [],
        proyectosPorSistema: {},
        tipos: [],
        temas: [],
        lastUpdate: Date.now()
      };

      const newCache: CacheData = {
        ...currentCache,
        ...data,
        lastUpdate: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(newCache));
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async isCacheValid(): Promise<boolean> {
    const cache = await this.getCache();
    return cache !== null;
  }
}