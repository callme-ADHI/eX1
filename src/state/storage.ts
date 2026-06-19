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
  icon: string; // SVG string
  order: number;
}

export interface ExtensionSettings {
  edgeActivation: boolean;
  shortcut: string;
  clockMode: "12h" | "24h";
  clockStyle: "analog" | "digital";
  blurAmount: number;
  animationSpeed: "slow" | "normal" | "fast";
  searchEngine: string;
}

export interface ExtensionState {
  theme: string;
  aiTools: AITool[];
  dockItems: DockItem[];
  settings: ExtensionSettings;
}

// ─── AI TOOL ICONS (recognizable brand-accurate SVGs) ───────────────────────

const ICONS = {
  // ChatGPT — Official OpenAI flower/knot logo
  chatgpt: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" fill-rule="evenodd">
    <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"/>
  </svg>`,

  // Claude — Anthropic hand-drawn crown/star
  claude: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M11.666.23a1.166 1.166 0 00-1.16 1.054L9.81 8.242 2.766 6.848a1.167 1.167 0 00-1.144.823l-.234 1.166a1.167 1.167 0 00.82 1.348l7.042 1.394-4.887 5.176a1.167 1.167 0 00-.012 1.583l.81.848a1.167 1.167 0 001.595.011l4.887-5.176.696 6.958a1.166 1.166 0 001.054 1.161l1.167.234a1.167 1.167 0 001.348-.82l1.394-7.042 5.176 4.887a1.167 1.167 0 001.583.012l.848-.81a1.167 1.167 0 00.011-1.595l-5.176-4.887 6.958-.696a1.166 1.166 0 001.161-1.054l.234-1.167a1.167 1.167 0 00-.82-1.348l-7.042-1.394 4.887-5.176a1.167 1.167 0 00.012-1.583l-.81-.848a1.167 1.167 0 00-1.595-.011L13.88 8.04l-.696-6.958A1.166 1.166 0 0012.13.08l-1.167-.234z"/>
  </svg>`,

  // Gemini — Sparkle shape
  gemini: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2c0 5.52-4.48 10-10 10 5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z"/>
  </svg>`,

  // Grok — Minimal "X" lettermark
  grok: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M19.167 2H22L13.784 11.411 22 22H16.333L11.83 16.113 6.942 22H4.11L12.825 12.022 4 2H9.808L13.882 7.391z"/>
  </svg>`,

  // DeepSeek — Official whale/ocean logo
  deepseek: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" fill-rule="evenodd">
    <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"/>
  </svg>`,

  // Kimi — K speech bubble style
  kimi: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M4 2h4v8.5L16.5 2H21l-9.5 9.5L21 22h-4.5L8 13.5V22H4V2z"/>
  </svg>`,

  // Lovable — Heart logo
  lovable: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>`,

  // Qwen — Cloud-infinity Q
  qwen: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.18 0 4.2-.7 5.85-1.9l3.45 1.15-1.15-3.45C21.3 16.2 22 14.18 22 12c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5c0 1.24-.45 2.38-1.2 3.25L17 17h-5z"/>
  </svg>`,

  // ─── DOCK / UTILITY ICONS ─────────────────────────────────────────────

  google: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8a4 4 0 1 1-3.9 3H12"/></svg>`,

  github: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,

  youtube: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="4.5" rx="3"/><path d="m10 9 5 3-5 3V9z"/></svg>`,

  leetcode: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 10 10-5 5-10-10zM12 7l4 4M9 16h6"/></svg>`,

  hackerrank: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z"/><path d="M9 8v8M15 8v8M9 12h6"/></svg>`,

  gmail: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,

  calendar: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,

  generic: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
};

const DEFAULT_STATE: ExtensionState = {
  theme: "obsidian-platinum",
  aiTools: [
    { id: "claude", name: "Claude", url: "https://claude.ai", icon: ICONS.claude, pinned: true, order: 0 },
    { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com", icon: ICONS.chatgpt, pinned: true, order: 1 },
    { id: "grok", name: "Grok", url: "https://grok.com", icon: ICONS.grok, pinned: true, order: 2 },
    { id: "kimi", name: "Kimi", url: "https://kimi.moonshot.cn", icon: ICONS.kimi, pinned: true, order: 3 },
    { id: "qwen", name: "Qwen", url: "https://chat.qwen.ai", icon: ICONS.qwen, pinned: true, order: 4 },
    { id: "gemini", name: "Gemini", url: "https://gemini.google.com", icon: ICONS.gemini, pinned: true, order: 5 },
    { id: "deepseek", name: "DeepSeek", url: "https://chat.deepseek.com", icon: ICONS.deepseek, pinned: true, order: 6 },
    { id: "lovable", name: "Lovable", url: "https://lovable.dev", icon: ICONS.lovable, pinned: true, order: 7 }
  ],
  dockItems: [
    { id: "google", name: "Google", url: "https://google.com", icon: ICONS.google, order: 0 },
    { id: "youtube", name: "YouTube", url: "https://youtube.com", icon: ICONS.youtube, order: 1 },
    { id: "github", name: "GitHub", url: "https://github.com", icon: ICONS.github, order: 2 },
    { id: "leetcode", name: "LeetCode", url: "https://leetcode.com", icon: ICONS.leetcode, order: 3 },
    { id: "hackerrank", name: "HackerRank", url: "https://hackerrank.com", icon: ICONS.hackerrank, order: 4 },
    { id: "gmail", name: "Gmail", url: "https://mail.google.com", icon: ICONS.gmail, order: 5 },
    { id: "calendar", name: "Calendar", url: "https://calendar.google.com", icon: ICONS.calendar, order: 6 }
  ],
  settings: {
    edgeActivation: true,
    shortcut: "Ctrl+Space",
    clockMode: "24h",
    clockStyle: "digital",
    blurAmount: 20,
    animationSpeed: "normal",
    searchEngine: "google"
  }
};

type StateChangeListener = (state: ExtensionState) => void;

class StorageManager {
  private listeners: StateChangeListener[] = [];
  private cache: ExtensionState | null = null;
  private isExtensionEnv: boolean;

  constructor() {
    this.isExtensionEnv = typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local;
    if (this.isExtensionEnv) {
      chrome.storage.onChanged.addListener(() => {
        // Reload cache and trigger listeners on external changes
        this.load().then((state) => {
          this.triggerListeners(state);
        });
      });
    }
  }

  public getGenericIcon(): string {
    return ICONS.generic;
  }

  public async load(): Promise<ExtensionState> {
    if (this.cache) {
      return this.cache;
    }

    const mergeState = (raw: any): ExtensionState => {
      const state = { ...DEFAULT_STATE, ...raw };
      state.settings = { ...DEFAULT_STATE.settings, ...raw.settings };
      
      // Ensure all default AI tools exist & update their icons/urls/names to latest versions
      if (raw.aiTools) {
        const mergedTools = raw.aiTools.map((rawTool: any) => {
          const defMatch = DEFAULT_STATE.aiTools.find(t => t.id === rawTool.id);
          if (defMatch) {
            return { ...rawTool, icon: defMatch.icon, url: defMatch.url, name: defMatch.name };
          }
          return rawTool;
        });
        DEFAULT_STATE.aiTools.forEach(defTool => {
          if (!mergedTools.some((t: any) => t.id === defTool.id)) {
            mergedTools.push(defTool);
          }
        });
        state.aiTools = mergedTools;
      }
      
      // Ensure all default dock items exist & update their icons/urls to latest versions
      if (raw.dockItems) {
        const mergedDock = raw.dockItems.map((rawDock: any) => {
          const defMatch = DEFAULT_STATE.dockItems.find(d => d.id === rawDock.id);
          if (defMatch) {
            return { ...rawDock, icon: defMatch.icon, url: defMatch.url, name: defMatch.name };
          }
          return rawDock;
        });
        DEFAULT_STATE.dockItems.forEach(defDock => {
          if (!mergedDock.some((d: any) => d.id === defDock.id)) {
            mergedDock.push(defDock);
          }
        });
        state.dockItems = mergedDock;
      }
      
      return state;
    };

    if (this.isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (result: Record<string, any>) => {
          const loadedState = mergeState(result);
          this.cache = loadedState;
          resolve(loadedState);
        });
      });
    } else {
      const stored = localStorage.getItem("ex1_state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const loadedState = mergeState(parsed);
          this.cache = loadedState;
          return loadedState;
        } catch (e) {
          console.error("Failed to parse localStorage state, resetting to default.", e);
        }
      }
      this.cache = DEFAULT_STATE;
      return DEFAULT_STATE;
    }
  }

  public async save(state: Partial<ExtensionState>): Promise<void> {
    const currentState = await this.load();
    const newState = { ...currentState, ...state };
    this.cache = newState;

    if (this.isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.set(newState, () => {
          this.triggerListeners(newState);
          resolve();
        });
      });
    } else {
      localStorage.setItem("ex1_state", JSON.stringify(newState));
      this.triggerListeners(newState);
    }
  }

  public onChange(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private triggerListeners(state: ExtensionState) {
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error("Error in storage listener", err);
      }
    });
  }
}

export const storageManager = new StorageManager();
export const getIconMap = () => ICONS;
