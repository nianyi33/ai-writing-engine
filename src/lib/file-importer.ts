import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx';
import type { Chapter } from './types';

export type ExportFormat = 'md' | 'txt' | 'docx';
export type ImportFormat = 'md' | 'txt' | 'docx';

export interface ImportResult {
  chapters: Omit<Chapter, 'id' | 'workId'>[];
  title: string;
  totalWords: number;
}

/**
 * Parse .docx file using mammoth — extract text, then split into chapters
 */
export async function parseDocxFile(arrayBuffer: ArrayBuffer, fileName: string): Promise<ImportResult> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value;
  if (!text.trim()) {
    throw new Error('文档内容为空，无法导入');
  }
  return parseMarkdownFile(text, fileName.replace(/\.docx$/i, ''));
}

/**
 * Parse .md file content into chapters
 * Chapter separators: # heading or --- horizontal rule
 */
export function parseMarkdownFile(content: string, fileName: string): ImportResult {
  const title = fileName.replace(/\.(md|txt)$/i, '');
  const chapters: Omit<Chapter, 'id' | 'workId'>[] = [];
  let totalWords = 0;

  // Try to split by # headings first
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const headingMatches = [...content.matchAll(headingRegex)];

  if (headingMatches.length > 0) {
    for (let i = 0; i < headingMatches.length; i++) {
      const match = headingMatches[i];
      const startIndex = match.index!;
      const endIndex = i < headingMatches.length - 1
        ? headingMatches[i + 1].index!
        : content.length;

      const chapterContent = content.slice(startIndex, endIndex).trim();
      const wordCount = countChineseWords(chapterContent);
      totalWords += wordCount;

      chapters.push({
        title: match[1].trim(),
        content: chapterContent,
        wordCount,
        order: i + 1,
        status: 'draft' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } else {
    // No headings found, try splitting by ---
    const parts = content.split(/^---$/gm).filter(p => p.trim());
    if (parts.length > 1) {
      parts.forEach((part, i) => {
        const trimmed = part.trim();
        const lines = trimmed.split('\n');
        const chapterTitle = lines[0].replace(/^#+\s*/, '').trim() || `第${i + 1}章`;
        const chapterContent = trimmed;
        const wordCount = countChineseWords(chapterContent);
        totalWords += wordCount;

        chapters.push({
          title: chapterTitle,
          content: chapterContent,
          wordCount,
          order: i + 1,
          status: 'draft' as const,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
    } else {
      // Single chapter
      const wordCount = countChineseWords(content);
      totalWords = wordCount;
      chapters.push({
        title: title,
        content,
        wordCount,
        order: 1,
        status: 'draft' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  return { chapters, title, totalWords };
}

/**
 * Parse .txt file content
 */
export function parseTextFile(content: string, fileName: string): ImportResult {
  return parseMarkdownFile(content, fileName);
}

/**
 * Count Chinese characters and words in text
 */
export function countChineseWords(text: string): number {
  // Count Chinese characters + English words
  const chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

/**
 * Read file from user's file system using File System Access API or traditional input
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

/**
 * Read binary file as ArrayBuffer (for .docx)
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export content as downloadable file
 */
export function downloadFile(content: string, filename: string, type: ExportFormat = 'md'): void {
  if (type === 'docx') {
    throw new Error('docx 导出请使用 exportDocx 函数');
  }
  const mimeMap: Record<string, string> = { md: 'text/markdown', txt: 'text/plain' };
  const mimeType = mimeMap[type] || 'text/plain';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${type}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export chapters as .docx file
 * Each chapter becomes a heading + body; preserved headings in markdown become sub-headings
 */
export async function exportDocx(
  chapters: { title: string; content: string }[],
  bookTitle: string,
): Promise<Blob> {
  const children: (Paragraph | PageBreak)[] = [];

  // Title page
  children.push(
    new Paragraph({
      text: bookTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `共 ${chapters.length} 章  ·  导出时间 ${new Date().toLocaleDateString('zh-CN')}`,
      spacing: { after: 600 },
    }),
  );

  for (const ch of chapters) {
    children.push(new PageBreak());

    // Chapter title as H1
    children.push(
      new Paragraph({
        text: ch.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
    );

    // Chapter body — split by lines, detect markdown headings for sub-levels
    const lines = ch.content.split('\n');
    for (const line of lines) {
      if (!line.trim()) {
        children.push(new Paragraph({ spacing: { after: 120 } }));
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)/);
      const h3Match = line.match(/^###\s+(.+)/);
      const h1Match = line.match(/^#\s+(.+)/);

      if (h1Match) {
        children.push(new Paragraph({
          text: h1Match[1],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 120, after: 80 },
        }));
      } else if (h2Match) {
        children.push(new Paragraph({
          text: h2Match[1],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 80 },
        }));
      } else if (h3Match) {
        children.push(new Paragraph({
          text: h3Match[1],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 60 },
        }));
      } else {
        // Normal text — strip inline markdown
        const cleanText = line
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/__(.+?)__/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/_(.+?)_/g, '$1')
          .replace(/`(.+?)`/g, '$1');

        children.push(new Paragraph({
          children: [new TextRun({ text: cleanText, size: 24 })], // 12pt ≈ 24 half-points
          spacing: { after: 60 },
        }));
      }
    }
  }

  const doc = new Document({
    title: bookTitle,
    description: `AI写作引擎导出的作品：${bookTitle}`,
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}

/**
 * Generate full book content from chapters
 */
export function generateBookContent(chapters: { title: string; content: string }[], bookTitle: string): string {
  let result = `# ${bookTitle}\n\n`;
  for (const ch of chapters) {
    result += `${ch.content}\n\n`;
  }
  return result;
}
