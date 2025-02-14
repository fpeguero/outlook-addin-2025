// src/utils/content-splitter.ts
export function splitContentIntoBlocks(content: string, maxLength: number = 2000): string[] {
    const blocks: string[] = [];
    let remainingContent = content;
  
    while (remainingContent.length > 0) {
      if (remainingContent.length <= maxLength) {
        blocks.push(remainingContent);
        break;
      }
  
      // Buscar el último salto de línea dentro del límite
      let splitIndex = remainingContent.lastIndexOf('\n', maxLength);
      
      // Si no hay salto de línea, buscar el último espacio
      if (splitIndex === -1) {
        splitIndex = remainingContent.lastIndexOf(' ', maxLength);
      }
      
      // Si no hay espacio, forzar el corte en el límite
      if (splitIndex === -1) {
        splitIndex = maxLength;
      }
  
      blocks.push(remainingContent.substring(0, splitIndex));
      remainingContent = remainingContent.substring(splitIndex).trim();
    }
  
    return blocks;
  }