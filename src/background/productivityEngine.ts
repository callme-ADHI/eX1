import { storageGet, storageSet, KEYS } from '../shared/storage';
import type { Task, ProductivityRollup, FocusSession, TabSnapshot } from '../shared/types';
import { isProductive, isDistracting } from '../shared/utils';

// ─── Productivity Engine ──────────────────────────────────────────────────────

export function initProductivityEngine() {
  // Recompute rollups every 5 minutes
  chrome.alarms.create('ex1:productivity:tick', { periodInMinutes: 5 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'ex1:productivity:tick') await computeAllRollups();
  });
  // Initial compute
  computeAllRollups();
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

export async function addTask(data: {
  title: string; description: string; category: string;
  dueAt: number | null; priority: string;
}): Promise<Task> {
  const tasks = (await storageGet<Task[]>(KEYS.TASKS)) ?? [];
  const task: Task = {
    id: `task_${Date.now()}`,
    title: data.title,
    description: data.description,
    category: data.category,
    createdAt: Date.now(),
    dueAt: data.dueAt,
    priority: data.priority as Task['priority'],
    status: 'pending',
  };
  tasks.push(task);
  await storageSet(KEYS.TASKS, tasks);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const tasks = (await storageGet<Task[]>(KEYS.TASKS)) ?? [];
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx < 0) return;
  tasks[idx] = { ...tasks[idx], ...updates };
  await storageSet(KEYS.TASKS, tasks);
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = (await storageGet<Task[]>(KEYS.TASKS)) ?? [];
  await storageSet(KEYS.TASKS, tasks.filter((t) => t.id !== id));
}

// ─── Rollup computation ───────────────────────────────────────────────────────

async function computeAllRollups() {
  await computeRollup('daily');
  await computeRollup('weekly');
}

async function computeRollup(period: 'daily' | 'weekly'): Promise<void> {
  const [sessions, snapshot, tasks] = await Promise.all([
    storageGet<FocusSession[]>(KEYS.FOCUS_SESSIONS),
    storageGet<TabSnapshot>(KEYS.TAB_SNAPSHOT),
    storageGet<Task[]>(KEYS.TASKS),
  ]);

  const cutoff = period === 'daily'
    ? Date.now() - 86_400_000
    : Date.now() - 7 * 86_400_000;

  // Focus sessions in period
  const periodSessions = (sessions ?? []).filter((s) => s.startedAt >= cutoff);
  const completedSessions = periodSessions.filter((s) => s.status === 'completed');
  const sessionCount = periodSessions.length;
  const completionRate = sessionCount > 0 ? completedSessions.length / sessionCount : 0;
  const totalFocusMs = completedSessions.reduce((acc, s) => acc + s.durationMinutes * 60_000, 0);
  const distractionAttempts = periodSessions.reduce((acc, s) => acc + s.distractionAttempts, 0);

  // Tab usage stats
  const tabs = snapshot?.tabs ?? [];
  let productiveMs = 0, neutralMs = 0, distractingMs = 0;
  for (const t of tabs) {
    if (isProductive(t.category)) productiveMs += t.activeDurationMs;
    else if (isDistracting(t.category)) distractingMs += t.activeDurationMs;
    else neutralMs += t.activeDurationMs;
  }

  // Task stats
  const allTasks = tasks ?? [];
  const completedTasks = allTasks.filter((t) => t.status === 'completed');
  const overdueTasks = allTasks.filter(
    (t) => t.dueAt && t.dueAt < Date.now() && t.status !== 'completed'
  );
  const staleTasks = allTasks.filter(
    (t) => t.status === 'pending' && Date.now() - t.createdAt > 7 * 86_400_000
  );

  // ─── Score computation (0–100, fully explainable) ─────────────────────────
  const positiveFactors: { label: string; contribution: number }[] = [];
  const negativeFactors:  { label: string; contribution: number }[] = [];

  // Positive
  if (completionRate > 0) {
    const c = Math.round(completionRate * 25);
    positiveFactors.push({ label: `Session completion rate (${Math.round(completionRate * 100)}%)`, contribution: c });
  }
  if (totalFocusMs > 0) {
    const focusHours = totalFocusMs / 3_600_000;
    const c = Math.min(20, Math.round(focusHours * 4));
    positiveFactors.push({ label: `Focus time (${focusHours.toFixed(1)}h)`, contribution: c });
  }
  if (completedTasks.length > 0) {
    const c = Math.min(20, completedTasks.length * 4);
    positiveFactors.push({ label: `Tasks completed (${completedTasks.length})`, contribution: c });
  }
  if (productiveMs > 0) {
    const ph = productiveMs / 3_600_000;
    const c = Math.min(15, Math.round(ph * 3));
    positiveFactors.push({ label: `Productive browsing (${ph.toFixed(1)}h)`, contribution: c });
  }

  // Negative
  if (distractingMs > 3_600_000) {
    const dh = distractingMs / 3_600_000;
    const c = -Math.min(20, Math.round((dh - 1) * 5));
    negativeFactors.push({ label: `Excess entertainment/social (${dh.toFixed(1)}h)`, contribution: c });
  }
  if (distractionAttempts > 0) {
    const c = -Math.min(10, distractionAttempts * 2);
    negativeFactors.push({ label: `Blocked-site attempts (${distractionAttempts})`, contribution: c });
  }
  if (overdueTasks.length > 0) {
    const c = -Math.min(15, overdueTasks.length * 5);
    negativeFactors.push({ label: `Overdue tasks (${overdueTasks.length})`, contribution: c });
  }
  if (staleTasks.length > 0) {
    const c = -Math.min(10, staleTasks.length * 2);
    negativeFactors.push({ label: `Stale incomplete tasks (${staleTasks.length})`, contribution: c });
  }

  const rawScore =
    positiveFactors.reduce((a, f) => a + f.contribution, 0) +
    negativeFactors.reduce((a, f) => a + f.contribution, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  const rollup: ProductivityRollup = {
    period,
    score,
    positiveFactors,
    negativeFactors,
    productiveMs,
    neutralMs,
    distractingMs,
    computedAt: Date.now(),
  };

  const key = period === 'daily' ? KEYS.ROLLUP_DAILY : KEYS.ROLLUP_WEEKLY;
  await storageSet(key, rollup);
}
