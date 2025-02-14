// src/services/notion/notion.service.ts
import { Client } from "@notionhq/client";
import { IDropdownOption } from "@fluentui/react";
import { StorageService } from "../storage/storage.service";
import { TaskData } from "../../types/notion.types";

export class NotionService {
  private static instance: NotionService;
  private client: Client | null = null;
  private token: string | null = null;
  private storageService: StorageService;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  static getInstance(): NotionService {
    if (!NotionService.instance) {
      NotionService.instance = new NotionService();
    }
    return NotionService.instance;
  }

  private async getHeaders(): Promise<Headers> {
    const config = await this.storageService.getConfig();
    if (!config.notionToken) {
      throw new Error('Notion token not found');
    }
    
    return new Headers({
      'Authorization': `Bearer ${config.notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    });
  }

  async initialize(): Promise<boolean> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionToken) {
        return false;
      }
      this.token = config.notionToken;
      return true;
    } catch (error) {
      console.error('Error initializing Notion client:', error);
      return false;
    }
  }

  // Añadir estos métodos a la clase NotionService

  async createPlanificacionTask(taskData: TaskData): Promise<string> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.planificacion) {
        throw new Error('Planificación database ID not configured');
      }

      const response = await this.fetchNotion(`/pages`, {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: config.notionDatabases.planificacion },
          properties: {
            "Tarea": {
              title: [
                {
                  text: {
                    content: taskData.title
                  }
                }
              ]
            },
            "Sistema": {
              relation: [
                {
                  id: taskData.sistemaId
                }
              ]
            },
            "Tipo": {
              select: {
                name: taskData.tipo
              }
            },
            "Tema": {
              select: {
                name: taskData.tema
              }
            },
            "Via": {
              select: {
                name: "Correo"
              }
            },
            "Próximos Pasos": {
              rich_text: [
                {
                  text: {
                    content: taskData.proximosPasos || ""
                  }
                }
              ]
            },
            "Resultado Esperado": {
              rich_text: [
                {
                  text: {
                    content: taskData.resultadoEsperado || ""
                  }
                }
              ]
            },
            "MsgUrl": {
              url: taskData.messageUrl || null
            },
            "Fecha_Solicitud": {
              date: {
                start: new Date().toISOString()
              }
            }
          }
        })
      });

      return response.id;
    } catch (error) {
      console.error('Error creating planificacion task:', error);
      throw error;
    }
  }

  

  async createTareaFromPlanificacion(planificacionId: string, taskData: TaskData): Promise<string> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.tareas) {
        throw new Error('Tareas database ID not configured');
      }

      const response = await this.fetchNotion(`/pages`, {
        method: 'POST',
        body: JSON.stringify({
          parent: { database_id: config.notionDatabases.tareas },
          properties: {
            "Title": {
              title: [
                {
                  text: {
                    content: taskData.title
                  }
                }
              ]
            },
            "Sistema": {
              relation: [
                {
                  id: taskData.sistemaId
                }
              ]
            },
            "🏦 Planificación": {
              relation: [
                {
                  id: planificacionId
                }
              ]
            },
            ...(taskData.proyectoId ? {
              "Proyecto": {
                relation: [
                  {
                    id: taskData.proyectoId
                  }
                ]
              }
            } : {}),
            "Tipo": {
              select: {
                name: taskData.tipo
              }
            },
            "Description": {
              rich_text: [
                {
                  text: {
                    content: `Próximos Pasos:\n${taskData.proximosPasos || ""}\n\nResultado Esperado:\n${taskData.resultadoEsperado || ""}\n\nEmail: ${taskData.messageUrl}`
                  }
                }
              ]
            },
            "Fecha": {
              date: {
                start: new Date().toISOString()
              }
            }
          }
        })
      });

      return response.id;
    } catch (error) {
      console.error('Error creating tarea:', error);
      throw error;
    }
  }

  private async fetchNotion(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = await this.getHeaders();
    
    const response = await fetch(`/api/notion${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSistemas(): Promise<IDropdownOption[]> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.sistemas) {
        throw new Error('Sistemas database ID not configured');
      }

      const response = await this.fetchNotion(`/databases/${config.notionDatabases.sistemas}/query`, {
        method: 'POST',
        body: JSON.stringify({
          sorts: [
            {
              property: 'Sistema',
              direction: 'ascending'
            }
          ]
        })
      });

      return response.results.map((page: any) => ({
        key: page.id,
        text: page.properties.Sistema.title[0]?.plain_text || ''
      }));
    } catch (error) {
      console.error('Error fetching sistemas:', error);
      throw error;
    }
  }

  async getTipos(): Promise<IDropdownOption[]> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.planificacion) {
        throw new Error('Planificación database ID not configured');
      }

      const response = await this.fetchNotion(`/databases/${config.notionDatabases.planificacion}`);

      const options = response.properties['Tipo'].select.options;
      return options.map((option: any) => ({
        key: option.name,
        text: option.name
      }));
    } catch (error) {
      console.error('Error fetching tipos:', error);
      throw error;
    }
  }

  async getTemas(): Promise<IDropdownOption[]> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.planificacion) {
        throw new Error('Planificación database ID not configured');
      }

      const response = await this.fetchNotion(`/databases/${config.notionDatabases.planificacion}`);

      const options = response.properties['Tema'].select.options;
      return options.map((option: any) => ({
        key: option.name,
        text: option.name
      }));
    } catch (error) {
      console.error('Error fetching temas:', error);
      throw error;
    }
  }

  async getProyectosPorSistema(sistemaId: string): Promise<IDropdownOption[]> {
    try {
      const config = await this.storageService.getConfig();
      if (!config.notionDatabases?.proyectos) {
        throw new Error('Proyectos database ID not configured');
      }

      const response = await this.fetchNotion(`/databases/${config.notionDatabases.proyectos}/query`, {
        method: 'POST',
        body: JSON.stringify({
          filter: {
            property: "Sistemas & Modulos",
            relation: {
              contains: sistemaId
            }
          },
          sorts: [
            {
              property: "Nombre del Proyecto",
              direction: "ascending"
            }
          ]
        })
      });

      return response.results.map((page: any) => ({
        key: page.id,
        text: page.properties["Nombre del Proyecto"].title[0]?.plain_text || ''
      }));
    } catch (error) {
      console.error('Error fetching proyectos:', error);
      throw error;
    }
  }

  async loadAllData(): Promise<{
    sistemas: IDropdownOption[];
    tipos: IDropdownOption[];
    temas: IDropdownOption[];
  }> {
    const [sistemas, tipos, temas] = await Promise.all([
      this.getSistemas(),
      this.getTipos(),
      this.getTemas()
    ]);

    return { sistemas, tipos, temas };
  }

  async validateDatabase(databaseId: string): Promise<boolean> {
    try {
      await this.fetchNotion(`/databases/${databaseId}`);
      return true;
    } catch (error) {
      console.error('Error validating database:', error);
      return false;
    }
  }
}