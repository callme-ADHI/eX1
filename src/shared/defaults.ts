import type { AITool, DockItem, AppSettings } from '../shared/types';

// ─── AI Tool default nodes ────────────────────────────────────────────────────

const iconClaude = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.827 3.52h3.603l-2.916 8.56H18.2L8.647 21.48l2.913-8.56H7.84L13.827 3.52Z" fill="currentColor"/></svg>`;
const iconChatGPT = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387 2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.412-.663zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"/></svg>`;
const iconGemini = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 24A14.232 14.232 0 0 1 9.894 12 14.232 14.232 0 0 1 12 0a14.232 14.232 0 0 1 2.106 12A14.232 14.232 0 0 1 12 24ZM0 12a14.232 14.232 0 0 1 12-2.106A14.232 14.232 0 0 1 24 12a14.232 14.232 0 0 1-12 2.106A14.232 14.232 0 0 1 0 12Z"/></svg>`;
const iconGrok = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.8 2 8.4 14.6H4L12.4 2zM7.2 22l8.4-12.6H20L11.6 22z"/></svg>`;
const iconDeepSeek = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Z" fill="currentColor" opacity=".15"/><path d="M8.5 9.5C8.5 8.119 9.619 7 11 7h2c1.381 0 2.5 1.119 2.5 2.5v5C15.5 15.881 14.381 17 13 17h-2c-1.381 0-2.5-1.119-2.5-2.5v-5ZM12 11v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const iconKimi = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0 12a8 8 0 0 1-6.245-2.996A6.98 6.98 0 0 1 12 13a6.98 6.98 0 0 1 6.245 2.004A8 8 0 0 1 12 18Z"/></svg>`;
const iconLovable = `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.593c-.425-.394-8.5-7.777-8.5-12.093a8.5 8.5 0 0 1 17 0c0 4.316-8.075 11.699-8.5 12.093Z"/></svg>`;

export const DEFAULT_AI_TOOLS: AITool[] = [
  { id: 'chatgpt',  name: 'ChatGPT',  url: 'https://chatgpt.com',    icon: iconChatGPT,  pinned: true, order: 0 },
  { id: 'claude',   name: 'Claude',   url: 'https://claude.ai',      icon: iconClaude,   pinned: true, order: 1 },
  { id: 'gemini',   name: 'Gemini',   url: 'https://gemini.google.com', icon: iconGemini, pinned: true, order: 2 },
  { id: 'grok',     name: 'Grok',     url: 'https://grok.com',       icon: iconGrok,     pinned: true, order: 3 },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com', icon: iconDeepSeek, pinned: true, order: 4 },
  { id: 'kimi',     name: 'Kimi',     url: 'https://kimi.moonshot.cn', icon: iconKimi,   pinned: true, order: 5 },
  { id: 'lovable',  name: 'Lovable',  url: 'https://lovable.dev',    icon: iconLovable,  pinned: true, order: 6 },
];

// ─── Dock default items ───────────────────────────────────────────────────────

const iconGmail = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457Z"/></svg>`;
const iconGitHub = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;
const iconHackerRank = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm-.189 16.989h-1.69v-4.502H7.933v4.502H6.244V7.012h1.69v3.91h2.188v-3.91h1.689v9.977zm6.725 0h-1.419l-2.754-5.48v5.48h-1.55V7.012h1.419l2.754 5.48V7.012h1.55v9.977z"/></svg>`;
const iconLeetCode = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>`;
const iconClassroom = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.997 0C5.378 0 0 5.377 0 11.997 0 18.617 5.378 24 11.997 24c6.619 0 11.999-5.383 11.999-12.003C23.996 5.377 18.616 0 11.997 0zm-.006 4.773l5.24 3.026-5.24 3.024L6.75 7.799l5.241-3.026zm-6.252 4.25l5.24 3.027v6.05l-5.24-3.024v-6.053zm12.503 0v6.053l-5.24 3.024v-6.05l5.24-3.027z"/></svg>`;
const iconEtlab = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

export const DEFAULT_DOCK_ITEMS: DockItem[] = [
  { id: 'gmail',      name: 'Gmail',           url: 'https://mail.google.com',      icon: iconGmail,     order: 0 },
  { id: 'classroom',  name: 'Google Classroom', url: 'https://classroom.google.com', icon: iconClassroom, order: 1 },
  { id: 'github',     name: 'GitHub',           url: 'https://github.com',           icon: iconGitHub,    order: 2 },
  { id: 'hackerrank', name: 'HackerRank',       url: 'https://www.hackerrank.com',   icon: iconHackerRank, order: 3 },
  { id: 'leetcode',   name: 'LeetCode',         url: 'https://leetcode.com',         icon: iconLeetCode,  order: 4 },
  { id: 'etlab',      name: 'ETLab',            url: 'https://mits.etlab.app',       icon: iconEtlab,     order: 5 },
];

// ─── Default settings ─────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'platinum',
  clockStyle: 'digital',
  clockMode: '24h',
  blurAmount: 20,
  animationSpeed: 'normal',
  edgeActivation: true,
  shortcut: 'Alt+Space',
  focusBlocklist: ['youtube.com', 'instagram.com', 'reddit.com', 'twitter.com', 'x.com'],
  searchEngine: 'google',
};
