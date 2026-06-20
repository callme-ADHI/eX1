// ─── Shared Types — single source of truth ───────────────────────────────────

export type FocusCategory = "Study" | "Coding" | "Research" | "Reading" | "Writing" | "Custom";
export type FocusStatus = "active" | "paused" | "completed" | "cancelled";
export type RiskLevel = "Safe" | "Medium Risk" | "High Risk";
export type ProductivityPeriod = "daily" | "weekly" | "monthly";
export type TaskState = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high";

export interface FocusSession {
  id: string;
  goal: string;
  category: FocusCategory;
  durationMinutes: number;
  startedAt: number;
  endedAt: number | null;
  status: FocusStatus;
  distractionAttempts: number;
}

export interface TabRecord {
  tabId: number;
  url: string;
  domain: string;
  title: string;
  openedAt: number;
  lastAccessedAt: number;
  activeDurationMs: number;
  visitCount: number;
  category: string;
}

export interface SecurityReport {
  origin: string;
  riskLevel: RiskLevel;
  domainAgeDays: number | null;
  https: boolean;
  certIssuer: string | null;
  certExpiresAt: number | null;
  flags: string[];
  permissions: {
    camera: string;
    microphone: string;
    geolocation: string;
    notifications: string;
    clipboard: string;
    popups: string;
  };
  generatedAt: number;
}

export interface ProductivityFactor {
  label: string;
  contribution: number;
}

export interface ProductivityRollup {
  period: ProductivityPeriod;
  score: number;
  positiveFactors: ProductivityFactor[];
  negativeFactors: ProductivityFactor[];
  productiveMs: number;
  neutralMs: number;
  distractingMs: number;
  computedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: number;
  dueAt: number | null;
  priority: TaskPriority;
  status: TaskState;
}

export interface TabSnapshot {
  tabs: TabRecord[];
  duplicates: { url: string; tabIds: number[] }[];
  totalTabs: number;
  byCategory: Record<string, number>;
  topDomains: { domain: string; visitCount: number; activeDurationMs: number }[];
  snapshotAt: number;
}

// ─── AI Tool / Dock config types ─────────────────────────────────────────────

export interface AITool {
  id: string;
  name: string;
  url: string;
  icon: string; // SVG string
  pinned: boolean;
  order: number;
}

export interface DockItem {
  id: string;
  name: string;
  url: string;
  icon: string;
  order: number;
}

export type ClockStyle = "analog" | "digital";
export type ClockMode = "12h" | "24h";
export type AnimationSpeed = "fast" | "normal" | "slow";
export type ThemeId = "platinum" | "sapphire" | "crimson" | "gold" | "emerald" | "violet";

export interface AppSettings {
  theme: ThemeId;
  clockStyle: ClockStyle;
  clockMode: ClockMode;
  blurAmount: number;
  animationSpeed: AnimationSpeed;
  edgeActivation: boolean;
  shortcut: string;
  focusBlocklist: string[];
  searchEngine: string;
}

export interface ExtensionState {
  aiTools: AITool[];
  dockItems: DockItem[];
  settings: AppSettings;
  focusSessions: FocusSession[];
  currentSession: FocusSession | null;
  tasks: Task[];
}
