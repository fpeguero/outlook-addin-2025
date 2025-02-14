export interface Sistema {
    id: string;
    name: string;
    todoistProjectId?: string;
    todoistProjectName?: string;
  }
  
  export interface TaskFormData {
    title: string;
    sistemaId: string;
    tipo: string;
    tema: string;
    proximosPasos?: string;
    resultadoEsperado?: string;
    messageUrl?: string;
    isProjectTask: boolean;
    addToTodoist: boolean;
    description?: string;
  }
  
// src/types/email.types.ts
export interface EmailData {
  subject: string;
  sender: string;
  messageUrl: string;
}
  
  // src/types/storage.types.ts
  export interface NotionConfig {
    token: string;
    databases: {
      planificacion: string;
      tareas: string;
      sistemas: string;
      proyectos: string;
    };
  }
  
  export interface TodoistConfig {
    token: string;
    defaultProject?: string;
  }
  
  export interface AppConfig {
    notion?: NotionConfig;
    todoist?: TodoistConfig;
  }

  // src/types/notion.types.ts
// src/types/notion.types.ts
export interface TaskData {
  title: string;
  sistemaId: string;
  proyectoId?: string;
  tipo: string;
  tema: string;
  proximosPasos?: string;
  resultadoEsperado?: string;
  messageUrl?: string;
  isProjectTask: boolean;
  addToTodoist: boolean;
  description?: string;  // Agregamos esta propiedad
}

export interface NotionResponse {
  id: string;
  object: string;
  created_time: string;
  last_edited_time: string;
  properties: any;
}

export interface NotionError {
  status: number;
  code: string;
  message: string;
}