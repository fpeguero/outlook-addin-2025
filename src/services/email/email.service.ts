// src/services/email/email.service.ts
import TurndownService from 'turndown';

export class EmailService {
  private static instance: EmailService;
  private turndownService: TurndownService;

  private constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '_'
    });

    // Mejorar el manejo de tablas
    this.turndownService.addRule('tableCell', {
      filter: ['th', 'td'],
      replacement: function(content, node) {
        return cell(content, node as HTMLElement);
      }
    });
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async getEmailContent(): Promise<string> {
    return new Promise((resolve, reject) => {
      const item = Office.context.mailbox.item;
      
      if (!item) {
        reject(new Error("No email item found"));
        return;
      }

      item.body.getAsync(Office.CoercionType.Html, (result) => {
        if (result.status === Office.AsyncResultStatus.Failed) {
          reject(new Error(result.error.message));
          return;
        }

        const htmlContent = result.value;
        const markdownContent = this.convertHtmlToMarkdown(htmlContent);
        resolve(markdownContent);
      });
    });
  }

  async getFormattedEmailDetails(): Promise<string> {
    const item = Office.context.mailbox.item;
    
    if (!item) {
      throw new Error("No email item found");
    }

    const emailContent = await this.getEmailContent();
    const sender = item.from?.displayName || item.from?.emailAddress || 'Unknown';
    const recipients = item.to?.map(r => r.displayName || r.emailAddress).join(', ') || 'No recipients';
    const subject = item.subject || 'No subject';
    const date = item.dateTimeCreated?.toLocaleString() || new Date().toLocaleString();

    return `## Email Details
**From:** ${sender}
**To:** ${recipients}
**Subject:** ${subject}
**Date:** ${date}

---

## Email Content

${emailContent}`;
  }

  private convertHtmlToMarkdown(html: string): string {
    try {
      // Limpiar y preparar el HTML
      let cleanHtml = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remover estilos
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remover scripts
        .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios
        .replace(/&nbsp;/g, ' ') // Reemplazar &nbsp; con espacio
        .replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (match, p1) => {
          // Preservar formato de bloques de código
          return '\n```\n' + p1.replace(/<br\s*\/?>/gi, '\n') + '\n```\n';
        });

      // Convertir el HTML limpio a Markdown
      let markdown = this.turndownService.turndown(cleanHtml);

      // Limpiar espacios extra y líneas en blanco
      markdown = markdown
        .replace(/\n\s+\n/g, '\n\n') // Reducir múltiples líneas en blanco a una
        .replace(/\n{3,}/g, '\n\n') // Máximo dos líneas en blanco seguidas
        .trim();

      return markdown;
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error);
      return html; // Devolver el HTML original si hay error
    }
  }
}

// Helper function for table cells
function cell(content: string, node: HTMLElement) {
  const index = node.parentElement ? Array.from(node.parentElement.children).indexOf(node) : 0;
  const prefix = ' '.repeat(index * 3); // Indent based on column
  return prefix + content + ' | ';
}