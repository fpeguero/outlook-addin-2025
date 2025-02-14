// src/taskpane/components/App.tsx
import * as React from "react";
import Progress from "./Progress";
import { TaskForm, TaskFormData, EmailData } from "./task-form/TaskForm";
import { ConfigPanel } from "./Configuration/ConfigPanel";
import { MessageBar, MessageBarType, Stack, PrimaryButton } from "@fluentui/react";
import { StorageService } from "../../services/storage/storage.service";
import { NotionService } from "../../services/notion/notion.service";

/* global console, Office */

export interface AppProps {
  title: string;
  isOfficeInitialized: boolean;
}

const App: React.FC<AppProps> = ({ title, isOfficeInitialized }) => {
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = React.useState(true);
  const [emailData, setEmailData] = React.useState<EmailData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const readEmailData = React.useCallback(async () => {
    try {
      console.log("Starting to read email data...");
      console.log("Office object:", !!Office);
      console.log("Office context:", !!Office?.context);
      console.log("Mailbox:", !!Office?.context?.mailbox);
      
      if (!Office?.context?.mailbox) {
        throw new Error("No se puede acceder al contexto de Outlook");
      }

      const mailbox = Office.context.mailbox;
      const item = mailbox.item;

      if (!item) {
        throw new Error("No hay correo seleccionado");
      }

      console.log("Email details:", {
        hasSubject: !!item.subject,
        subject: item.subject,
        hasFrom: !!item.from,
        from: item.from,
        hasItemId: !!item.itemId,
        itemId: item.itemId
      });

      const emailDataObj: EmailData = {
        subject: item.subject || "Sin asunto",
        sender: item.from?.emailAddress || "Sin remitente",
        messageUrl: `https://outlook.office.com/mail/deeplink/message/${item.itemId}`
      };

      console.log("Created email data object:", emailDataObj);
      setEmailData(emailDataObj);
      return true;
    } catch (error) {
      console.error("Error reading email data:", error);
      setError(`Error al cargar los datos del correo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return false;
    }
  }, []);

  React.useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const storageService = StorageService.getInstance();
        const config = await storageService.getConfig();
        setIsConfigured(!!config.notionToken && !!config.notionDatabases?.planificacion);
      } catch (error) {
        console.error("Error checking configuration:", error);
        setError("Error al verificar la configuración");
      } finally {
        setIsCheckingConfig(false);
      }
    };

    if (isOfficeInitialized) {
      checkConfiguration();
    }
  }, [isOfficeInitialized]);

  React.useEffect(() => {
    if (isOfficeInitialized && isConfigured) {
      readEmailData();
    }
  }, [isOfficeInitialized, isConfigured, readEmailData]);

  const handleSubmit = async (data: TaskFormData) => {
    try {
      const notionService = NotionService.getInstance();
      const planificacionId = await notionService.createPlanificacionTask(data);

      if (data.isProjectTask) {
        await notionService.createTareaFromPlanificacion(planificacionId, data);
      }

      Office.context.mailbox.item?.notificationMessages.replaceAsync(
        "taskCreated",
        {
          type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
          message: "Tarea creada exitosamente",
          icon: "Icon.16x16",
          persistent: false,
        }
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(`Error al crear la tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  };

  if (!isOfficeInitialized) {
    return (
      <Progress
        title={title}
        logo={require("./../../../assets/logo-filled.png")}
        message="Iniciando el add-in..."
      />
    );
  }

  if (isCheckingConfig) {
    return (
      <Progress
        title={title}
        logo={require("./../../../assets/logo-filled.png")}
        message="Verificando configuración..."
      />
    );
  }

  if (!isConfigured) {
    return <ConfigPanel onConfigured={() => setIsConfigured(true)} />;
  }

  if (error) {
    return (
      <Stack tokens={{ padding: 20 }}>
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={true}
          onDismiss={() => setError(null)}
          actions={
            <PrimaryButton onClick={() => readEmailData()}>
              Reintentar
            </PrimaryButton>
          }
        >
          {error}
        </MessageBar>
      </Stack>
    );
  }

  if (!emailData) {
    return (
      <Progress
        title={title}
        logo={require("./../../../assets/logo-filled.png")}
        message="Cargando datos del correo..."
      />
    );
  }

  return (
    <Stack>
      <Stack.Item align="end" styles={{ root: { padding: '10px' } }}>
        <PrimaryButton 
          iconProps={{ iconName: 'Settings' }}
          onClick={() => setIsConfigured(false)}
          text="Configuración"
        />
      </Stack.Item>
      <TaskForm emailData={emailData} onSubmit={handleSubmit} />
    </Stack>
  );
};

export default App;