import CryptoJS from 'crypto-js';

export interface StorageConfig {
  notionToken?: string;
  notionDatabases?: {
    planificacion: string;
    tareas: string;
    sistemas: string;
    proyectos: string;
  };
  todoistToken?: string;
  todoistDefaultProject?: string;
}

const STORAGE_KEY = 'outlook_notion_config';
const ENCRYPTION_KEY = 'your-secret-key'; // En producción, esto debería ser más seguro

export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async saveConfig(config: Partial<StorageConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      const encryptedData = this.encrypt(JSON.stringify(newConfig));
      localStorage.setItem(STORAGE_KEY, encryptedData);
    } catch (error) {
      console.error('Error saving config:', error);
      throw new Error('Failed to save configuration');
    }
  }

  async getConfig(): Promise<StorageConfig> {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) {
        return {};
      }
      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Error getting config:', error);
      return {};
    }
  }

  async clearConfig(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing config:', error);
      throw new Error('Failed to clear configuration');
    }
  }

  // Métodos específicos para configuraciones individuales
  async getNotionToken(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.notionToken;
  }

  async getNotionDatabases(): Promise<StorageConfig['notionDatabases']> {
    const config = await this.getConfig();
    return config.notionDatabases;
  }

  async getTodoistToken(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.todoistToken;
  }

  async validateConfig(): Promise<boolean> {
    const config = await this.getConfig();
    return !!(
      config.notionToken &&
      config.notionDatabases?.planificacion &&
      config.notionDatabases?.tareas &&
      config.notionDatabases?.sistemas
    );
  }
}