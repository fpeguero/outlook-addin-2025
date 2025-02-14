// src/hooks/useNotionData.ts
import { useState, useEffect, useCallback } from 'react';
import { IDropdownOption } from '@fluentui/react';
import { NotionService } from '../services/notion/notion.service';
import { CacheService } from '../services/cache/cache.service';
import { StorageService } from '../services/storage/storage.service';

export const useNotionData = () => {
  const [sistemas, setSistemas] = useState<IDropdownOption[]>([]);
  const [proyectos, setProyectos] = useState<IDropdownOption[]>([]);
  const [tipos, setTipos] = useState<IDropdownOption[]>([]);
  const [temas, setTemas] = useState<IDropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateNotionConnection = async () => {
    try {
      const storageService = StorageService.getInstance();
      const config = await storageService.getConfig();
      
      console.log('Checking Notion configuration:', {
        hasToken: !!config.notionToken,
        hasDatabases: !!config.notionDatabases,
        databases: config.notionDatabases
      });

      if (!config.notionToken) {
        throw new Error('Token de Notion no configurado');
      }

      if (!config.notionDatabases?.planificacion || 
          !config.notionDatabases?.sistemas) {
        throw new Error('IDs de bases de datos no configurados');
      }

      const notionService = NotionService.getInstance();
      const initialized = await notionService.initialize();
      
      console.log('Notion service initialized:', initialized);
      
      if (!initialized) {
        throw new Error('No se pudo inicializar la conexión con Notion');
      }

      return true;
    } catch (error) {
      console.error('Error validating Notion connection:', error);
      throw error;
    }
  };

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting to load Notion data...');

      // Primero validamos la conexión
      await validateNotionConnection();

      const cacheService = CacheService.getInstance();
      const notionService = NotionService.getInstance();

      // Si no forzamos refresh, intentamos usar caché
      if (!forceRefresh) {
        console.log('Checking cache...');
        const cachedData = await cacheService.getCache();
        if (cachedData) {
          console.log('Using cached data');
          setSistemas(cachedData.sistemas);
          setTipos(cachedData.tipos);
          setTemas(cachedData.temas);
          setIsLoading(false);
          return;
        }
      }

      console.log('Loading fresh data from Notion...');
      const { sistemas, tipos, temas } = await notionService.loadAllData();
      
      console.log('Data loaded:', {
        sistemasCount: sistemas.length,
        tiposCount: tipos.length,
        temasCount: temas.length
      });

      await cacheService.updateCache({
        sistemas,
        tipos,
        temas
      });

      setSistemas(sistemas);
      setTipos(tipos);
      setTemas(temas);
    } catch (error) {
      console.error('Error loading Notion data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los datos de Notion');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProyectos = useCallback(async (sistemaId: string) => {
    if (!sistemaId) {
      setProyectos([]);
      return;
    }

    try {
      console.log('Loading projects for sistema:', sistemaId);
      const cacheService = CacheService.getInstance();
      const cachedData = await cacheService.getCache();
      
      if (cachedData?.proyectosPorSistema?.[sistemaId]) {
        console.log('Using cached projects');
        setProyectos(cachedData.proyectosPorSistema[sistemaId]);
        return;
      }

      const notionService = NotionService.getInstance();
      const proyectos = await notionService.getProyectosPorSistema(sistemaId);
      
      console.log('Projects loaded:', proyectos.length);

      await cacheService.updateCache({
        proyectosPorSistema: {
          ...(cachedData?.proyectosPorSistema || {}),
          [sistemaId]: proyectos
        }
      });

      setProyectos(proyectos);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProyectos([]);
      setError('Error al cargar los proyectos');
    }
  }, []);

  const refreshCache = useCallback(async () => {
    console.log('Forcing cache refresh...');
    await loadData(true);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sistemas,
    proyectos,
    tipos,
    temas,
    isLoading,
    error,
    loadProyectos,
    refreshCache
  };
};