// src/taskpane/components/task-form/TaskFormContainer.tsx
import * as React from "react";
import { Stack, MessageBar, MessageBarType } from "@fluentui/react";
import { TaskForm } from "./TaskForm";
import { TaskData, EmailData } from "../../../types/notion.types";
import { NotionService } from "../../../services/notion/notion.service";

interface TaskFormContainerProps {
  onDismiss?: () => void;
}

export const TaskFormContainer: React.FC<TaskFormContainerProps> = ({ onDismiss }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [emailData, setEmailData] = React.useState<EmailData | null>(null);

  React.useEffect(() => {
    const loadEmailData = async () => {
      try {
        const item = Office.context.mailbox.item;
        if (!item) {
          throw new Error("No hay correo seleccionado");
        }

        const emailDataObj: EmailData = {
          subject: item.subject || "",
          sender: item.from?.emailAddress || "",
          messageUrl: item.itemId ? 
            `https://outlook.office.com/mail/deeplink/message/${item.itemId}` :
            ""
        };

        setEmailData(emailDataObj);
      } catch (error) {
        setError("Error al cargar los datos del correo");
      }
    };

    loadEmailData();
  }, []);

  const handleSubmit = async (data: TaskData) => {
    try {
      const notionService = NotionService.getInstance();

      // Crear tarea en Planificación
      const planificacionId = await notionService.createPlanificacionTask({
        ...data,
        messageUrl: data.messageUrl
      });

      // Si es una tarea de proyecto, crear en Tareas
      if (data.isProjectTask) {
        await notionService.createTareaFromPlanificacion(planificacionId, {
          ...data,
          description: `Próximos Pasos:\n${data.proximosPasos || ""}\n\nResultado Esperado:\n${data.resultadoEsperado || ""}`
        });
      }

      // Mostrar mensaje de éxito
      Office.context.mailbox.item?.notificationMessages.replaceAsync(
        "taskCreated",
        {
          type: Office.MailboxEnums.ItemNotificationMessageType.InformationalMessage,
          message: "Tarea creada exitosamente",
          icon: "Icon.16x16",
          persistent: false,
        }
      );

      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      setError(`Error al crear la tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  };

  if (error) {
    return (
      <Stack tokens={{ padding: 20 }}>
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          onDismiss={() => setError(null)}
        >
          {error}
        </MessageBar>
      </Stack>
    );
  }

  if (!emailData) {
    return null;
  }

  return (
    <TaskForm
      emailData={emailData}
      onSubmit={handleSubmit}
      onDismiss={onDismiss}
    />
  );
};