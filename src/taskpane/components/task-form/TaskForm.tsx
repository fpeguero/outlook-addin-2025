// src/taskpane/components/TaskForm/TaskForm.tsx
import * as React from "react";
import {
  Stack,
  TextField,
  Dropdown,
  IDropdownOption,
  Checkbox,
  PrimaryButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  IStackStyles,
  DefaultButton,
} from "@fluentui/react";
import { useNotionData } from "../../../hooks/useNotionData";

export interface EmailData {
  subject: string;
  sender: string;
  messageUrl: string;
}

export interface TaskFormData {
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
}

export interface TaskFormProps {
  emailData: EmailData;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDismiss?: () => void;
}

const stackStyles: IStackStyles = {
  root: {
    padding: 20,
    maxWidth: '100%',
    boxSizing: 'border-box'
  }
};

export const TaskForm: React.FC<TaskFormProps> = ({ emailData, onSubmit, onDismiss }) => {
  const {
    sistemas,
    proyectos,
    tipos,
    temas,
    isLoading: isLoadingData,
    error: dataError,
    loadProyectos,
    refreshCache
  } = useNotionData();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<TaskFormData>({
    title: `${emailData.sender.toUpperCase()} - ${emailData.subject}`,
    sistemaId: "",
    tipo: "",
    tema: "",
    proximosPasos: "",
    resultadoEsperado: "",
    messageUrl: emailData.messageUrl,
    isProjectTask: false,
    addToTodoist: false
  });

  const handleSistemaChange = React.useCallback((_: any, option?: IDropdownOption) => {
    if (option) {
      setFormData(prev => ({ 
        ...prev, 
        sistemaId: option.key as string,
        proyectoId: undefined // Limpiar el proyecto seleccionado
      }));
      loadProyectos(option.key as string);
    }
  }, [loadProyectos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Validaciones
      if (!formData.sistemaId) throw new Error("Debe seleccionar un Sistema");
      if (!formData.tipo) throw new Error("Debe seleccionar un Tipo");
      if (!formData.tema) throw new Error("Debe seleccionar un Tema");

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error instanceof Error ? error.message : "Error al crear la tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={stackStyles}>
        <Spinner size={SpinnerSize.large} label="Cargando datos..." />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 15 }} styles={stackStyles}>
      {(error || dataError) && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={true}
          onDismiss={() => setError(null)}
          actions={
            dataError ? (
              <PrimaryButton onClick={refreshCache} iconProps={{ iconName: 'Refresh' }}>
                Recargar datos
              </PrimaryButton>
            ) : undefined
          }
        >
          {error || dataError}
        </MessageBar>
      )}

      <form onSubmit={handleSubmit}>
        <Stack tokens={{ childrenGap: 10 }}>
          <TextField
            label="Título"
            required
            value={formData.title}
            onChange={(_, newValue) => 
              setFormData(prev => ({ ...prev, title: newValue || "" }))
            }
          />

          <Dropdown
            label="Sistema"
            required
            options={sistemas}
            selectedKey={formData.sistemaId}
            onChange={handleSistemaChange}
            placeholder="Seleccione un sistema"
          />

          {formData.sistemaId && (
            <Dropdown
              label="Proyecto"
              options={proyectos}
              selectedKey={formData.proyectoId}
              onChange={(_, option) => 
                setFormData(prev => ({ ...prev, proyectoId: option?.key as string }))
              }
              placeholder="Seleccione un proyecto (opcional)"
            />
          )}

          <Dropdown
            label="Tipo"
            required
            options={tipos}
            selectedKey={formData.tipo}
            onChange={(_, option) => 
              setFormData(prev => ({ ...prev, tipo: option?.key as string }))
            }
            placeholder="Seleccione un tipo"
          />

          <Dropdown
            label="Tema"
            required
            options={temas}
            selectedKey={formData.tema}
            onChange={(_, option) => 
              setFormData(prev => ({ ...prev, tema: option?.key as string }))
            }
            placeholder="Seleccione un tema"
          />

          <TextField
            label="Próximos Pasos"
            multiline
            rows={3}
            value={formData.proximosPasos}
            onChange={(_, newValue) => 
              setFormData(prev => ({ ...prev, proximosPasos: newValue }))
            }
            placeholder="Describe los próximos pasos a seguir"
          />

          <TextField
            label="Resultado Esperado"
            multiline
            rows={3}
            value={formData.resultadoEsperado}
            onChange={(_, newValue) => 
              setFormData(prev => ({ ...prev, resultadoEsperado: newValue }))
            }
            placeholder="Describe el resultado que se espera obtener"
          />

          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Checkbox
              label="Agregar como tarea de proyecto"
              checked={formData.isProjectTask}
              onChange={(_, checked) => 
                setFormData(prev => ({ ...prev, isProjectTask: !!checked }))
              }
            />

            <Checkbox
              label="Agregar a Todoist"
              checked={formData.addToTodoist}
              onChange={(_, checked) => 
                setFormData(prev => ({ ...prev, addToTodoist: !!checked }))
              }
            />
          </Stack>

          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
            {onDismiss && (
              <DefaultButton
                text="Cancelar"
                onClick={onDismiss}
                disabled={isSubmitting}
              />
            )}
            <PrimaryButton
              text={isSubmitting ? "Creando..." : "Crear Tarea"}
              type="submit"
              disabled={isSubmitting}
            />
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
};