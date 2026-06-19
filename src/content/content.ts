import styles from "../style.css?inline";
import { storageManager, type ExtensionState } from "../state/storage";
import { THEMES } from "../themes/variants";
import { ClockWidget } from "../components/clock/clock";
import { AIWheel } from "../components/wheel/wheel";
import { CommandSearchBar } from "../components/search/search";
import { BottomDock } from "../components/dock/dock";
import { SettingsPanel } from "../components/settings/settings";

class EX1HUDOverlay {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  
  // HUD Elements
  private containerEl!: HTMLElement;
  private edgeTriggerEl!: HTMLElement;
  private contextMenuEl: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;

  // Component Instances
  private clock!: ClockWidget;
  private wheel!: AIWheel;
  private search!: CommandSearchBar;
  private dock!: BottomDock;
  private settings!: SettingsPanel;

  // State
  private wheelOpen: boolean = false;
  private state: ExtensionState | null = null;

  constructor() {
    // 1. Create host element
    this.host = document.createElement("div");
    this.host.id = "ex-one-hud-host";
    
    // 2. Attach shadow DOM
    this.shadow = this.host.attachShadow({ mode: "open" });
    
    // 3. Inject styles into shadow DOM
    const styleTag = document.createElement("style");
    styleTag.textContent = styles;
    this.shadow.appendChild(styleTag);

    // 4. Inject host into page root
    document.documentElement.appendChild(this.host);

    this.init();
  }

  private async init() {
    this.state = await storageManager.load();

    // Setup basic container — always visible, no backdrop
    this.containerEl = document.createElement("div");
    this.containerEl.className = "hud-container";
    this.shadow.appendChild(this.containerEl);

    // Edge Activation Trigger Zone — thin invisible strip at left edge
    this.edgeTriggerEl = document.createElement("div");
    this.edgeTriggerEl.className = "edge-trigger interactive";
    this.shadow.appendChild(this.edgeTriggerEl);

    // ─── Instantiate components ───
    // Clock: always visible on left
    this.clock = new ClockWidget(this.containerEl);

    // AI Wheel: ONLY element that pops in/out
    this.wheel = new AIWheel(
      this.containerEl,
      this.showEditModal.bind(this),
      this.showContextMenu.bind(this)
    );

    // Search bar: always visible top-right
    this.search = new CommandSearchBar(this.containerEl);

    // Bottom dock: always visible bottom-center
    this.dock = new BottomDock(
      this.containerEl,
      this.showEditModal.bind(this),
      this.showContextMenu.bind(this)
    );

    // Settings gear: always visible
    this.settings = new SettingsPanel(
      this.containerEl,
      this.showEditModal.bind(this)
    );

    this.applyThemeAndSettings();
    this.setupListeners();

    // Make always-visible components visible immediately
    this.clock.setVisible(true);
    this.search.setVisible(true);
    this.dock.setVisible(true);
  }

  private applyThemeAndSettings() {
    if (!this.state) return;

    // 1. Accent Colors
    const activeTheme = THEMES.find((t) => t.id === this.state!.theme) || THEMES[0];
    this.host.style.setProperty("--accent", activeTheme.accent);
    this.host.style.setProperty("--accent-muted", activeTheme.accentMuted);

    // 2. Blur Settings
    this.host.style.setProperty("--blur-amount", `${this.state.settings.blurAmount}px`);

    // 3. Animation Speed
    const speed = this.state.settings.animationSpeed;
    const speedMs = speed === "fast" ? "100ms" : speed === "slow" ? "300ms" : "200ms";
    this.host.style.setProperty("--transition-speed", speedMs);

    // 4. Edge activation toggle
    this.edgeTriggerEl.style.display = this.state.settings.edgeActivation ? "block" : "none";
  }

  private setupListeners() {
    // Listen for Theme/Settings changes
    storageManager.onChange((newState) => {
      this.state = newState;
      this.applyThemeAndSettings();
    });

    // Toggle AI Wheel via edge trigger hover
    this.edgeTriggerEl.addEventListener("mouseenter", () => {
      if (this.state?.settings.edgeActivation) {
        this.setWheelOpen(true);
      }
    });

    // Close wheel automatically when mouse leaves the wheel panel
    this.wheel.getElement().addEventListener("mouseleave", () => {
      if (this.wheelOpen) {
        this.setWheelOpen(false);
      }
    });

    // Close wheel and settings when clicking empty container space
    this.containerEl.addEventListener("click", (e) => {
      if (e.target === this.containerEl) {
        if (this.wheelOpen) {
          this.setWheelOpen(false);
        }
        this.settings.setVisible(false);
      }
    });

    // Close settings / context menus on clicking outside
    document.addEventListener("click", (e) => {
      const path = e.composedPath();
      const insideSettings = path.some(el => {
        if (el instanceof HTMLElement) {
          return el.classList.contains("settings-panel") || el.classList.contains("settings-trigger");
        }
        return false;
      });
      if (!insideSettings) {
        this.settings.setVisible(false);
      }
    });

    // Close context menus on any click inside shadow DOM
    this.shadow.addEventListener("click", () => {
      this.closeContextMenu();
    });

    // Keyboard trigger listeners
    window.addEventListener("keydown", (e) => {
      // Ctrl+Space toggles AI wheel
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        this.setWheelOpen(!this.wheelOpen);
      }

      // Escape closes wheel or settings
      if (e.key === "Escape") {
        const settingsPanelEl = this.containerEl.querySelector(".settings-panel");
        if (settingsPanelEl?.classList.contains("settings-open")) {
          this.settings.setVisible(false);
        } else if (this.wheelOpen) {
          this.setWheelOpen(false);
        }
      }
    });

    // Listen for toggle command from background worker (extension only)
    try {
      chrome.runtime.onMessage.addListener((message: any) => {
        if (message.action === "toggle-hud") {
          this.setWheelOpen(!this.wheelOpen);
        }
      });
    } catch (_) {
      // Not in extension context
    }
  }

  /** Only toggles the AI wheel — everything else stays visible */
  private setWheelOpen(open: boolean) {
    this.wheelOpen = open;

    if (open) {
      this.wheel.setVisible(true);
      this.containerEl.classList.add("wheel-active");
      this.edgeTriggerEl.style.pointerEvents = "none";
    } else {
      this.wheel.setVisible(false);
      this.containerEl.classList.remove("wheel-active");
      this.edgeTriggerEl.style.pointerEvents = "auto";
      this.settings.setVisible(false);
      this.closeContextMenu();
      this.closeModal();
    }
  }

  // ─── SHARED MODAL & CONTEXT MENU UTILITIES ───

  private showContextMenu(
    x: number,
    y: number,
    options: { label: string; action: () => void; danger?: boolean }[]
  ) {
    this.closeContextMenu();

    this.contextMenuEl = document.createElement("div");
    this.contextMenuEl.className = "context-menu";
    
    const pad = 10;
    const rightBoundary = window.innerWidth - 160;
    const bottomBoundary = window.innerHeight - 100;
    
    this.contextMenuEl.style.left = `${Math.min(x, rightBoundary) - pad}px`;
    this.contextMenuEl.style.top = `${Math.min(y, bottomBoundary) - pad}px`;

    options.forEach((opt) => {
      const item = document.createElement("div");
      item.className = `context-menu-item ${opt.danger ? "danger" : ""}`;
      item.textContent = opt.label;
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        opt.action();
        this.closeContextMenu();
      });
      this.contextMenuEl!.appendChild(item);
    });

    this.containerEl.appendChild(this.contextMenuEl);
  }

  private closeContextMenu() {
    if (this.contextMenuEl) {
      this.contextMenuEl.remove();
      this.contextMenuEl = null;
    }
  }

  private showEditModal(
    title: string,
    fields: { label: string; key: string; value: string }[],
    onConfirm: (data: Record<string, string>) => void
  ) {
    this.closeModal();

    this.modalEl = document.createElement("div");
    this.modalEl.className = "hud-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "hud-modal";
    this.modalEl.appendChild(modal);

    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.textContent = title;
    modal.appendChild(titleEl);

    const inputs: Record<string, HTMLInputElement> = {};

    fields.forEach((field) => {
      const fieldContainer = document.createElement("div");
      fieldContainer.style.display = "flex";
      fieldContainer.style.flexDirection = "column";
      fieldContainer.style.gap = "4px";

      const label = document.createElement("label");
      label.className = "settings-label";
      label.textContent = field.label;
      fieldContainer.appendChild(label);

      const input = document.createElement("input");
      input.className = "modal-input";
      input.type = "text";
      input.value = field.value;
      fieldContainer.appendChild(input);
      
      inputs[field.key] = input;
      modal.appendChild(fieldContainer);
    });

    const buttons = document.createElement("div");
    buttons.className = "modal-buttons";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "modal-btn cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.closeModal());
    buttons.appendChild(cancelBtn);

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "modal-btn confirm";
    confirmBtn.textContent = "Confirm";
    confirmBtn.addEventListener("click", () => {
      const result: Record<string, string> = {};
      Object.keys(inputs).forEach((key) => {
        result[key] = inputs[key].value;
      });
      onConfirm(result);
      this.closeModal();
    });
    buttons.appendChild(confirmBtn);

    modal.appendChild(buttons);
    this.containerEl.appendChild(this.modalEl);

    // Fade-in animation frame
    requestAnimationFrame(() => {
      this.modalEl?.classList.add("modal-open");
      const firstKey = fields[0]?.key;
      if (firstKey && inputs[firstKey]) {
        inputs[firstKey].focus();
      }
    });

    // Close on overlay background click
    this.modalEl.addEventListener("click", (e) => {
      if (e.target === this.modalEl) {
        this.closeModal();
      }
    });
  }

  private closeModal() {
    if (this.modalEl) {
      this.modalEl.classList.remove("modal-open");
      const currentModal = this.modalEl;
      setTimeout(() => {
        currentModal.remove();
      }, 200);
      this.modalEl = null;
    }
  }
}

// Prevent double injection
if (!(window as any).ex1HUDInjected) {
  (window as any).ex1HUDInjected = true;
  new EX1HUDOverlay();
}
