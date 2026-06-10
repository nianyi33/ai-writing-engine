import { diffWords, diffLines, type Change } from 'diff';

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  count?: number;
}

/**
 * Compute word-level diff between original and modified text
 */
export function computeWordDiff(original: string, modified: string): DiffResult[] {
  const changes: Change[] = diffWords(original, modified);
  return changes.map(c => ({
    type: c.added ? 'added' : c.removed ? 'removed' : 'unchanged',
    value: c.value,
    count: c.count,
  }));
}

/**
 * Compute line-level diff
 */
export function computeLineDiff(original: string, modified: string): DiffResult[] {
  const changes: Change[] = diffLines(original, modified);
  return changes.map(c => ({
    type: c.added ? 'added' : c.removed ? 'removed' : 'unchanged',
    value: c.value,
    count: c.count,
  }));
}

/**
 * Generate a unified diff view string
 */
export function generateUnifiedDiff(original: string, modified: string): string {
  const changes = diffLines(original, modified);
  let result = '';
  for (const change of changes) {
    const prefix = change.added ? '+' : change.removed ? '-' : ' ';
    const lines = change.value.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i === lines.length - 1 && lines[i] === '') continue;
      result += `${prefix} ${lines[i]}\n`;
    }
  }
  return result;
}
