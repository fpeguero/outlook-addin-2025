import create from 'zustand';
import { StorageService, StorageConfig } from '../services/storage/storage.service';

interface AppState {
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  config: StorageConfig;
  setConfig: (config: Partial<StorageConfig>) => Promise<void>;
  initializeApp: () => Promise<void>;
  clearConfig: () => Promise<void>;
}

const storageService = StorageService.getInstance();

export const useAppStore = create<AppState>((set, get) => ({
  isConfigured: false,
  isLoading: true,
  error: null,
  config: {},

  setConfig: async (newConfig) => {
    try {
      set({ isLoading: true, error: null });
      await storageService.saveConfig(newConfig);
      const config = await storageService.getConfig();
      const isConfigured = await storageService.validateConfig();
      set({ config, isConfigured, isLoading: false });
    } catch (error) {
      set({ 
        error: 'Error al guardar la configuración', 
        isLoading: false 
      });
    }
  },

  initializeApp: async () => {
    try {
      set({ isLoading: true, error: null });
      const config = await storageService.getConfig();
      const isConfigured = await storageService.validateConfig();
      set({ config, isConfigured, isLoading: false });
    } catch (error) {
      set({ 
        error: 'Error al inicializar la aplicación', 
        isLoading: false 
      });
    }
  },

  clearConfig: async () => {
    try {
      set({ isLoading: true, error: null });
      await storageService.clearConfig();
      set({ 
        config: {}, 
        isConfigured: false, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: 'Error al limpiar la configuración', 
        isLoading: false 
      });
    }
  },
}));