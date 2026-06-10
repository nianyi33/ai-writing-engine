import { v4 as uuid } from 'uuid';
import type { StoryBranch, BranchChapter } from './types';
import { getBranchesByWork, saveBranch, deleteBranch as deleteBr } from './storage';

export async function getBranches(workId: string): Promise<StoryBranch[]> {
  return getBranchesByWork(workId);
}

export async function getBranch(workId: string, branchId: string): Promise<StoryBranch | undefined> {
  const branches = await getBranches(workId);
  return branches.find(b => b.id === branchId);
}

export function createBranch(
  workId: string,
  name: string,
  description: string,
  forkChapterId: string,
  forkPosition: number,
  parentBranchId: string | null = null,
): StoryBranch {
  const branch: StoryBranch = {
    id: uuid(),
    workId,
    name,
    description,
    forkChapterId,
    forkPosition,
    parentBranchId,
    chapters: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  // Fire-and-forget save (return branch synchronously for UI)
  saveBranch(branch).catch(e => console.error('保存分支失败:', e));
  return branch;
}

export async function updateBranch(
  workId: string,
  branchId: string,
  updates: Partial<StoryBranch>,
): Promise<StoryBranch | null> {
  const branch = await getBranch(workId, branchId);
  if (!branch) return null;
  const updated = { ...branch, ...updates, updatedAt: Date.now() };
  await saveBranch(updated);
  return updated;
}

export async function deleteBranch(workId: string, branchId: string): Promise<boolean> {
  const branch = await getBranch(workId, branchId);
  if (!branch) return false;
  await deleteBr(branchId);
  return true;
}

export async function addBranchChapter(
  workId: string,
  branchId: string,
  title: string,
  content = '',
  summary = '',
): Promise<BranchChapter | null> {
  const branch = await getBranch(workId, branchId);
  if (!branch) return null;
  const ch: BranchChapter = {
    id: uuid(),
    title,
    content,
    summary,
    order: branch.chapters.length + 1,
    status: 'draft',
  };
  branch.chapters.push(ch);
  await saveBranch(branch);
  return ch;
}

export async function updateBranchChapter(
  workId: string,
  branchId: string,
  chapterId: string,
  updates: Partial<BranchChapter>,
): Promise<boolean> {
  const branch = await getBranch(workId, branchId);
  if (!branch) return false;
  const idx = branch.chapters.findIndex(c => c.id === chapterId);
  if (idx === -1) return false;
  branch.chapters[idx] = { ...branch.chapters[idx], ...updates };
  await saveBranch(branch);
  return true;
}

export interface BranchTreeNode {
  branch: StoryBranch;
  children: BranchTreeNode[];
}

export async function buildBranchTree(workId: string): Promise<BranchTreeNode[]> {
  const branches = await getBranches(workId);
  const roots = branches.filter(b => !b.parentBranchId);
  const map = new Map<string, BranchTreeNode>();

  for (const b of branches) {
    map.set(b.id, { branch: b, children: [] });
  }

  for (const b of branches) {
    if (b.parentBranchId) {
      const parent = map.get(b.parentBranchId);
      const self = map.get(b.id);
      if (parent && self) parent.children.push(self);
    }
  }

  return roots.map(r => map.get(r.branch.id)!).filter(Boolean);
}
