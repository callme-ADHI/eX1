import { storageManager, type ExtensionState } from "../../state/storage";

interface SearchEngine {
  id: string;
  name: string;
  urlTemplate: string;
  icon: string;
  prefix: string;
}

const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: "google", name: "Google", prefix: "g:",
    urlTemplate: "https://google.com/search?q=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8a4 4 0 1 1-3.9 3H12"/></svg>`
  },
  {
    id: "duckduckgo", name: "DuckDuckGo", prefix: "d:",
    urlTemplate: "https://duckduckgo.com/?q=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2m-6-6h2m8 0h2"/></svg>`
  },
  {
    id: "youtube", name: "YouTube", prefix: "yt:",
    urlTemplate: "https://youtube.com/results?search_query=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="15" x="2" y="4.5" rx="3"/><path d="m10 9 5 3-5 3V9z"/></svg>`
  },
  {
    id: "wikipedia", name: "Wikipedia", prefix: "w:",
    urlTemplate: "https://en.wikipedia.org/w/index.php?search=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h4l6-12 6 12h4L12 2z"/></svg>`
  },
  {
    id: "github", name: "GitHub", prefix: "gh:",
    urlTemplate: "https://github.com/search?q=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`
  },
  {
    id: "stackoverflow", name: "Stack Overflow", prefix: "so:",
    urlTemplate: "https://stackoverflow.com/search?q=",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 16h12M8 12h8M10 8h4"/></svg>`
  }
];

export class CommandSearchBar {
  private element: HTMLElement;
  private input: HTMLInputElement;
  private engineBadge: HTMLElement;
  private wrapper: HTMLElement;
  private dropdown: HTMLElement;
  private engineSelector: HTMLElement;
  
  private state: ExtensionState | null = null;
  private activeEngine: SearchEngine = SEARCH_ENGINES[0];
  private showingEngineMenu: boolean = false;

  constructor(private parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "search-container";
    this.parent.appendChild(this.element);

    this.wrapper = document.createElement("div");
    this.wrapper.className = "search-bar-wrapper";
    this.element.appendChild(this.wrapper);

    // Engine badge (clickable to switch)
    this.engineBadge = document.createElement("div");
    this.engineBadge.className = "search-engine-badge interactive";
    this.wrapper.appendChild(this.engineBadge);

    // Search Icon
    const iconSpan = document.createElement("span");
    iconSpan.className = "search-icon";
    iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
    this.wrapper.appendChild(iconSpan);

    // Text Input
    this.input = document.createElement("input");
    this.input.className = "search-input";
    this.input.type = "text";
    this.input.placeholder = "Search the web...";
    this.wrapper.appendChild(this.input);

    // Shortcut hint
    const hint = document.createElement("span");
    hint.className = "search-hint";
    hint.textContent = "↵";
    this.wrapper.appendChild(hint);

    // Engine selector dropdown
    this.engineSelector = document.createElement("div");
    this.engineSelector.className = "engine-selector";
    this.engineSelector.style.display = "none";
    this.element.appendChild(this.engineSelector);

    // Search results dropdown
    this.dropdown = document.createElement("div");
    this.dropdown.className = "search-dropdown";
    this.dropdown.style.display = "none";
    this.element.appendChild(this.dropdown);

    this.init();
  }

  private async init() {
    this.state = await storageManager.load();
    this.setEngine(this.state?.settings.searchEngine || "google");

    storageManager.onChange((newState) => {
      this.state = newState;
    });

    this.setupListeners();
    this.renderEngineBadge();
  }

  private setEngine(engineId: string) {
    this.activeEngine = SEARCH_ENGINES.find(e => e.id === engineId) || SEARCH_ENGINES[0];
    this.renderEngineBadge();
    this.input.placeholder = `Search ${this.activeEngine.name}...`;
  }

  private renderEngineBadge() {
    this.engineBadge.innerHTML = `${this.activeEngine.icon}<span>${this.activeEngine.name}</span>`;
  }

  private setupListeners() {
    this.input.addEventListener("input", () => this.handleInput());
    this.input.addEventListener("keydown", (e) => this.handleKeyDown(e));
    
    this.input.addEventListener("focus", () => {
      this.element.classList.add("search-focused");
    });

    this.input.addEventListener("blur", () => {
      setTimeout(() => {
        this.element.classList.remove("search-focused");
        this.hideDropdown();
        this.hideEngineSelector();
      }, 200);
    });

    // Engine badge click — toggle engine selector
    this.engineBadge.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.showingEngineMenu) {
        this.hideEngineSelector();
      } else {
        this.showEngineSelector();
      }
    });

    // Close selector / dropdown on clicking outside
    document.addEventListener("click", (e) => {
      const path = e.composedPath();
      const insideSearch = path.some(el => el === this.element);
      if (!insideSearch) {
        this.hideEngineSelector();
        this.hideDropdown();
        this.element.classList.remove("search-focused");
      }
    });
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.element.classList.add("search-visible");
    } else {
      this.element.classList.remove("search-focused");
    }
  }

  private showEngineSelector() {
    this.showingEngineMenu = true;
    this.hideDropdown();
    this.engineSelector.innerHTML = "";
    this.engineSelector.style.display = "flex";

    SEARCH_ENGINES.forEach((engine) => {
      const item = document.createElement("div");
      item.className = `engine-item ${engine.id === this.activeEngine.id ? "active" : ""}`;
      item.innerHTML = `
        ${engine.icon}
        <span>${engine.name}</span>
        <span class="engine-prefix">${engine.prefix}</span>
      `;
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        this.setEngine(engine.id);
        this.hideEngineSelector();
        this.input.focus();
        const settings = { ...this.state!.settings, searchEngine: engine.id };
        await storageManager.save({ settings });
      });
      this.engineSelector.appendChild(item);
    });
  }

  private hideEngineSelector() {
    this.showingEngineMenu = false;
    this.engineSelector.style.display = "none";
  }

  private handleInput() {
    const rawVal = this.input.value;

    // Check for engine prefix shortcuts
    for (const engine of SEARCH_ENGINES) {
      if (rawVal.toLowerCase().startsWith(engine.prefix)) {
        this.setEngine(engine.id);
        this.input.value = rawVal.substring(engine.prefix.length).trimStart();
        break;
      }
    }

    const currentVal = this.input.value.trim();

    if (currentVal.length > 0) {
      // Check if it's a direct AI name match
      const matchedTool = this.state?.aiTools.find(
        (t) => t.name.toLowerCase() === currentVal.toLowerCase() || t.id === currentVal.toLowerCase()
      );

      if (matchedTool) {
        this.renderDirectMatch(matchedTool.name);
      } else {
        this.renderSearchSuggestion(currentVal);
      }
    } else {
      this.hideDropdown();
    }
  }

  private renderDirectMatch(toolName: string) {
    this.dropdown.innerHTML = "";
    this.dropdown.style.display = "flex";

    const item = document.createElement("div");
    item.className = "dropdown-item active";
    item.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
      <span>Launch ${toolName}</span>
      <span class="dropdown-item-shortcut">Enter</span>
    `;
    item.addEventListener("click", () => this.executeAction());
    this.dropdown.appendChild(item);
  }

  private renderSearchSuggestion(query: string) {
    this.dropdown.innerHTML = "";
    this.dropdown.style.display = "flex";

    const item = document.createElement("div");
    item.className = "dropdown-item active";
    item.innerHTML = `
      ${this.activeEngine.icon}
      <span>Search "${query}" on ${this.activeEngine.name}</span>
      <span class="dropdown-item-shortcut">↵</span>
    `;
    item.addEventListener("click", () => this.executeAction());
    this.dropdown.appendChild(item);
  }

  private hideDropdown() {
    this.dropdown.style.display = "none";
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.executeAction();
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.input.blur();
      this.hideDropdown();
      this.hideEngineSelector();
    } else if (e.key === "Tab") {
      // Tab cycles through engines
      e.preventDefault();
      const currentIdx = SEARCH_ENGINES.findIndex(e => e.id === this.activeEngine.id);
      const nextIdx = (currentIdx + 1) % SEARCH_ENGINES.length;
      this.setEngine(SEARCH_ENGINES[nextIdx].id);
    }
  }

  private executeAction() {
    const query = this.input.value.trim();

    // 1. Direct AI tool name match
    if (query.length > 0) {
      const matchedTool = this.state?.aiTools.find(
        (t) => t.name.toLowerCase() === query.toLowerCase() || t.id === query.toLowerCase()
      );
      if (matchedTool) {
        window.open(matchedTool.url, "_blank");
        this.input.value = "";
        this.hideDropdown();
        return;
      }
    }

    // 2. Search with active engine
    if (query.length > 0) {
      window.open(this.activeEngine.urlTemplate + encodeURIComponent(query), "_blank");
      this.input.value = "";
      this.hideDropdown();
      return;
    }
  }
}
