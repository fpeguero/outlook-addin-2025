// src/taskpane/components/Configuration/ConfigPanel.tsx
import * as React from "react";
import {
  Stack,
  TextField,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Label,
  Toggle,
  IStackStyles,
  Text,
  DefaultButton
} from "@fluentui/react";
import { NotionService } from "../../../services/notion/notion.service";
import { StorageService } from "../../../services/storage/storage.service";

interface ConfigPanelProps {
  onConfigured: () => void;
  onCancel?: () => void;
}

const stackStyles: IStackStyles = {
  root: {
    padding: 20,
    maxWidth: '100%',
    boxSizing: 'border-box'
  }
};

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ onConfigured, onCancel }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notionToken, setNotionToken] = React.useState("");
  const [databaseIds, setDatabaseIds] = React.useState({
    planificacion: "",
    tareas: "",
    sistemas: "",
    proyectos: ""
  });
  const [todoistEnabled, setTodoistEnabled] = React.useState(false);
  const [todoistToken, setTodoistToken] = React.useState("");

  // Cargar configuración existente al montar el componente
  React.useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const storageService = StorageService.getInstance();
        const config = await storageService.getConfig();
        
        if (config.notionToken) {
          setNotionToken(config.notionToken);
        }
        
        if (config.notionDatabases) {
          setDatabaseIds(config.notionDatabases);
        }
        
        if (config.todoistToken) {
          setTodoistToken(config.todoistToken);
          setTodoistEnabled(true);
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingConfig();
  }, []);

  const validateAndSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar campos requeridos
      if (!notionToken) {
        throw new Error("El token de Notion es requerido");
      }
      if (!databaseIds.planificacion || !databaseIds.tareas || !databaseIds.sistemas) {
        throw new Error("Los IDs de las bases de datos principales son requeridos");
      }

      // Guardar configuración
      const storageService = StorageService.getInstance();
      await storageService.saveConfig({
        notionToken,
        notionDatabases: databaseIds,
        ...(todoistEnabled && todoistToken ? { todoistToken } : {})
      });

      // Verificar conexión con Notion
      const notionService = NotionService.getInstance();
      const initialized = await notionService.initialize();
      if (!initialized) {
        throw new Error("No se pudo inicializar la conexión con Notion");
      }

      // Validar acceso a las bases de datos
      try {
        await Promise.all([
          notionService.validateDatabase(databaseIds.planificacion),
          notionService.validateDatabase(databaseIds.tareas),
          notionService.validateDatabase(databaseIds.sistemas)
        ]);
      } catch (error) {
        throw new Error("No se pudo acceder a una o más bases de datos. Verifica los IDs y permisos.");
      }

      onConfigured();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error al guardar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={stackStyles}>
        <Spinner size={SpinnerSize.large} label="Cargando configuración..." />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={stackStyles}>
      <Text variant="xLarge">Configuración del Add-in</Text>
      
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => setError(null)}
        >
          {error}
        </MessageBar>
      )}

      <Stack tokens={{ childrenGap: 10 }}>
        <Label>Configuración de Notion</Label>
        <TextField
          label="Token de Notion"
          required
          type="password"
          value={notionToken}
          onChange={(_, newValue) => setNotionToken(newValue || "")}
        />

        <TextField
          label="ID Base de Datos - Planificación"
          required
          value={databaseIds.planificacion}
          onChange={(_, newValue) => 
            setDatabaseIds(prev => ({ ...prev, planificacion: newValue || "" }))
          }
        />

        <TextField
          label="ID Base de Datos - Tareas"
          required
          value={databaseIds.tareas}
          onChange={(_, newValue) => 
            setDatabaseIds(prev => ({ ...prev, tareas: newValue || "" }))
          }
        />

        <TextField
          label="ID Base de Datos - Sistemas"
          required
          value={databaseIds.sistemas}
          onChange={(_, newValue) => 
            setDatabaseIds(prev => ({ ...prev, sistemas: newValue || "" }))
          }
        />

        <TextField
          label="ID Base de Datos - Proyectos"
          value={databaseIds.proyectos}
          onChange={(_, newValue) => 
            setDatabaseIds(prev => ({ ...prev, proyectos: newValue || "" }))
          }
        />
      </Stack>

      <Stack tokens={{ childrenGap: 10 }}>
        <Toggle
          label="Habilitar integración con Todoist"
          checked={todoistEnabled}
          onChange={(_, checked) => setTodoistEnabled(!!checked)}
        />

        {todoistEnabled && (
          <TextField
            label="Token de Todoist"
            type="password"
            required
            value={todoistToken}
            onChange={(_, newValue) => setTodoistToken(newValue || "")}
          />
        )}
      </Stack>

      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        {onCancel && (
          <DefaultButton
            text="Cancelar"
            onClick={onCancel}
          />
        )}
        <PrimaryButton
          text="Guardar Configuración"
          onClick={validateAndSave}
          disabled={isLoading}
        />
      </Stack>

      {isLoading && (
        <Stack horizontalAlign="center">
          <Spinner size={SpinnerSize.large} label="Validando configuración..." />
        </Stack>
      )}
    </Stack>
  );
};