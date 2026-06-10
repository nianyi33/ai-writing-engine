import { v4 as uuid } from 'uuid';
import type { Chapter, ChapterVersion } from './types';
import { saveVersion, getVersionsByChapter, deleteOldVersions } from './storage';

export async function createVersion(
  chapter: Chapter,
  trigger: ChapterVersion['trigger'] = 'manual',
  description: string = '',
): Promise<ChapterVersion> {
  const versions = await getVersionsByChapter(chapter.id);
  const seq = (versions[0]?.sequence ?? 0) + 1;

  const version: ChapterVersion = {
    id: uuid(),
    chapterId: chapter.id,
    content: chapter.content,
    contentHash: await hashContent(chapter.content),
    trigger,
    description,
    timestamp: Date.now(),
    sequence: seq,
  };

  await saveVersion(version);
  // Keep only last 20 versions
  await deleteOldVersions(chapter.id, 20);
  return version;
}

export async function restoreVersion(
  chapterId: string,
  versionId: string,
): Promise<string | null> {
  const versions = await getVersionsByChapter(chapterId);
  const version = versions.find(v => v.id === versionId);
  return version?.content ?? null;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
