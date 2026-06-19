import { storageManager, type ExtensionState } from "../../state/storage";
import { THEMES } from "../../themes/variants";

export class SettingsPanel {
  private trigger: HTMLElement;
  private panel: HTMLElement;
  private state: ExtensionState | null = null;
  private currentTab: string = "tools";

  constructor(
    private parent: HTMLElement,
    private showEditModal: (
      title: string,
      fields: { label: string; key: string; value: string }[],
      onConfirm: (data: Record<string, string>) => void
    ) => void
  ) {
    // 1. Create settings gear trigger button
    this.trigger = document.createElement("div");
    this.trigger.className = "settings-trigger interactive";
    this.trigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    this.parent.appendChild(this.trigger);

    // 2. Create settings panel
    this.panel = document.createElement("div");
    this.panel.className = "settings-panel hud-panel interactive";
    this.parent.appendChild(this.panel);

    // 3. Panel header with close button (rendered before init so it's available early)
    const panelHeader = document.createElement("div");
    panelHeader.className = "settings-panel-header";
    panelHeader.innerHTML = `
      <div class="settings-panel-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9z"/></svg>
        eX1 HUD Settings
      </div>
      <button class="settings-close-btn" id="settings-close-x" title="Close">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    this.panel.appendChild(panelHeader);

    this.init();
  }

  private async init() {
    this.state = await storageManager.load();
    this.render();

    // Re-render tabs or settings values when state shifts
    storageManager.onChange((newState) => {
      this.state = newState;
      this.updateValues();
    });

    this.setupListeners();
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.trigger.classList.add("active");
      this.panel.classList.add("settings-open");
    } else {
      this.trigger.classList.remove("active");
      this.panel.classList.remove("settings-open");
    }
  }

  private setupListeners() {
    // Toggle settings panel on gear click
    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = this.panel.classList.contains("settings-open");
      this.setVisible(!isOpen);
    });

    // Close button inside header
    this.panel.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("#settings-close-x")) {
        this.setVisible(false);
        return;
      }
      // Stop propagation inside panel to prevent closing overlay by clicking inside settings
      e.stopPropagation();
    });
  }

  private render() {
    // Preserve existing header if present
    const existingHeader = this.panel.querySelector(".settings-panel-header");
    this.panel.innerHTML = "";
    if (existingHeader) {
      this.panel.appendChild(existingHeader);
    }

    // Body wrapper: sidebar + content
    const body = document.createElement("div");
    body.className = "settings-body";

    // Sidebar Tab Rail
    const sidebar = document.createElement("div");
    sidebar.className = "settings-sidebar";
    
    const tabs = [
      { id: "tools", name: "AI Tools" },
      { id: "dock", name: "Dock" },
      { id: "appearance", name: "Appearance" },
      { id: "shortcuts", name: "Shortcuts" },
      { id: "about", name: "About" }
    ];

    tabs.forEach((tab) => {
      const tabBtn = document.createElement("button");
      tabBtn.className = `settings-tab-btn ${this.currentTab === tab.id ? "active" : ""}`;
      tabBtn.textContent = tab.name;
      tabBtn.addEventListener("click", () => {
        this.currentTab = tab.id;
        sidebar.querySelectorAll(".settings-tab-btn").forEach((b) => b.classList.remove("active"));
        tabBtn.classList.add("active");
        this.showTabContent(tab.id);
      });
      sidebar.appendChild(tabBtn);
    });

    body.appendChild(sidebar);

    // Settings Content Container
    const content = document.createElement("div");
    content.className = "settings-content";
    body.appendChild(content);

    this.panel.appendChild(body);

    // Render tab components
    this.renderAIToolsTab(content);
    this.renderDockTab(content);
    this.renderAppearanceTab(content);
    this.renderShortcutsTab(content);
    this.renderAboutTab(content);

    this.showTabContent(this.currentTab);
  }

  private showTabContent(tabId: string) {
    const contents = this.panel.querySelectorAll(".settings-tab-content");
    contents.forEach((c) => {
      const el = c as HTMLElement;
      if (el.dataset.tab === tabId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  private updateValues() {
    if (!this.state) return;

    // We can re-render sections of active tab or full redraw for consistency
    if (this.currentTab === "tools" || this.currentTab === "dock" || this.currentTab === "appearance" || this.currentTab === "shortcuts") {
      this.render(); // Simple full redraw to keep lists and sliders accurate
    }
  }

  // --- TAB RENDERING LOGIC ---

  private renderAIToolsTab(parent: HTMLElement) {
    const tab = document.createElement("div");
    tab.className = "settings-tab-content";
    tab.dataset.tab = "tools";

    tab.innerHTML = `
      <div class="settings-title">AI Wheel Config</div>
      <div class="settings-subtitle">Manage AI search companion nodes listed on the radial wheel.</div>
      <div class="editor-list" id="ai-tools-list"></div>
      <div class="settings-btn-row">
        <button class="settings-btn" id="add-ai-tool-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add AI Companion
        </button>
      </div>
    `;

    const listEl = tab.querySelector("#ai-tools-list")!;
    const tools = this.state?.aiTools || [];
    tools.forEach((tool) => {
      const item = document.createElement("div");
      item.className = "editor-item";
      item.innerHTML = `
        <div style="width:16px;height:16px;display:flex;align-items:center;">${tool.icon}</div>
        <div class="editor-item-name">${tool.name}</div>
        <div class="editor-item-url">${tool.url}</div>
        <div class="editor-item-actions">
          <button class="editor-action-btn pin-toggle" title="${tool.pinned ? "Unpin from wheel" : "Pin to wheel"}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="${tool.pinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
          <button class="editor-action-btn delete" title="Delete tool">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Toggle pin status
      item.querySelector(".pin-toggle")!.addEventListener("click", async () => {
        const updated = this.state!.aiTools.map((t) =>
          t.id === tool.id ? { ...t, pinned: !t.pinned } : t
        );
        await storageManager.save({ aiTools: updated });
      });

      // Delete tool
      item.querySelector(".delete")!.addEventListener("click", async () => {
        const updated = this.state!.aiTools.filter((t) => t.id !== tool.id);
        await storageManager.save({ aiTools: updated });
      });

      listEl.appendChild(item);
    });

    // Add tool button click
    tab.querySelector("#add-ai-tool-btn")!.addEventListener("click", () => {
      this.showEditModal("Add AI Companion", [
        { label: "Name", key: "name", value: "" },
        { label: "URL", key: "url", value: "https://" }
      ], async (data) => {
        if (data.name && data.url) {
          const newId = data.name.toLowerCase().replace(/[^a-z0-9]/g, "") || Date.now().toString();
          const order = this.state?.aiTools.length || 0;
          const newTools = [
            ...this.state!.aiTools,
            { id: newId, name: data.name, url: data.url, icon: storageManager.getGenericIcon(), pinned: true, order }
          ];
          await storageManager.save({ aiTools: newTools });
        }
      });
    });

    parent.appendChild(tab);
  }

  private renderDockTab(parent: HTMLElement) {
    const tab = document.createElement("div");
    tab.className = "settings-tab-content";
    tab.dataset.tab = "dock";

    tab.innerHTML = `
      <div class="settings-title">Bottom Dock Settings</div>
      <div class="settings-subtitle">Manage URLs pinned to the macOS-style dock at the bottom of the page.</div>
      <div class="editor-list" id="dock-items-list"></div>
      <div class="settings-btn-row">
        <button class="settings-btn" id="add-dock-item-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Pinned Website
        </button>
      </div>
    `;

    const listEl = tab.querySelector("#dock-items-list")!;
    const dockItems = this.state?.dockItems || [];
    dockItems.forEach((item) => {
      const itemEl = document.createElement("div");
      itemEl.className = "editor-item";
      itemEl.innerHTML = `
        <div style="width:16px;height:16px;display:flex;align-items:center;">${item.icon}</div>
        <div class="editor-item-name">${item.name}</div>
        <div class="editor-item-url">${item.url}</div>
        <div class="editor-item-actions">
          <button class="editor-action-btn delete" title="Delete item">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Delete item
      itemEl.querySelector(".delete")!.addEventListener("click", async () => {
        const updated = this.state!.dockItems.filter((d) => d.id !== item.id);
        await storageManager.save({ dockItems: updated });
      });

      listEl.appendChild(itemEl);
    });

    // Add dock item click
    tab.querySelector("#add-dock-item-btn")!.addEventListener("click", () => {
      this.showEditModal("Add Pinned Website", [
        { label: "Name", key: "name", value: "" },
        { label: "URL", key: "url", value: "https://" }
      ], async (data) => {
        if (data.name && data.url) {
          const newId = data.name.toLowerCase().replace(/[^a-z0-9]/g, "") || Date.now().toString();
          const order = this.state?.dockItems.length || 0;
          const newItems = [
            ...this.state!.dockItems,
            { id: newId, name: data.name, url: data.url, icon: storageManager.getGenericIcon(), order }
          ];
          await storageManager.save({ dockItems: newItems });
        }
      });
    });

    parent.appendChild(tab);
  }

  private renderAppearanceTab(parent: HTMLElement) {
    const tab = document.createElement("div");
    tab.className = "settings-tab-content";
    tab.dataset.tab = "appearance";

    tab.innerHTML = `
      <div class="settings-title">Appearance & Styling</div>
      
      <div class="settings-group">
        <div class="settings-label">Select Active Accent Theme</div>
        <div class="theme-grid">
          ${THEMES.map((theme) => `
            <div class="theme-swatch ${this.state?.theme === theme.id ? "active" : ""}" data-theme-id="${theme.id}">
              <div class="theme-color-dot" style="background: ${theme.accent}"></div>
              <div class="theme-swatch-name">${theme.name}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Clock Widget Display</div>
            <div class="settings-desc">Choose analog or digital face style.</div>
          </div>
          <select class="settings-select" id="clock-style-select">
            <option value="analog" ${this.state?.settings.clockStyle === "analog" ? "selected" : ""}>Analog Only</option>
            <option value="digital" ${this.state?.settings.clockStyle === "digital" ? "selected" : ""}>Digital Only</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Clock Format</div>
            <div class="settings-desc">Toggle between 12-hour or 24-hour presentation.</div>
          </div>
          <select class="settings-select" id="clock-mode-select">
            <option value="12h" ${this.state?.settings.clockMode === "12h" ? "selected" : ""}>12 Hour</option>
            <option value="24h" ${this.state?.settings.clockMode === "24h" ? "selected" : ""}>24 Hour</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-label">HUD Blur Amount</div>
        <div class="settings-slider-wrapper">
          <input type="range" class="settings-slider" id="blur-slider" min="0" max="40" value="${this.state?.settings.blurAmount ?? 20}">
          <div class="settings-slider-val" id="blur-val">${this.state?.settings.blurAmount ?? 20}px</div>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-label">HUD Animation Velocity</div>
        <div class="settings-toggle-row">
          <select class="settings-select" id="anim-speed-select" style="width:100%;">
            <option value="fast" ${this.state?.settings.animationSpeed === "fast" ? "selected" : ""}>Fast (100ms)</option>
            <option value="normal" ${this.state?.settings.animationSpeed === "normal" ? "selected" : ""}>Normal (200ms)</option>
            <option value="slow" ${this.state?.settings.animationSpeed === "slow" ? "selected" : ""}>Damped (300ms)</option>
          </select>
        </div>
      </div>
    `;

    // Theme selector listeners
    tab.querySelectorAll(".theme-swatch").forEach((swatch) => {
      swatch.addEventListener("click", async () => {
        const themeId = swatch.getAttribute("data-theme-id");
        if (themeId) {
          await storageManager.save({ theme: themeId });
        }
      });
    });

    // Clock Style change listener
    const styleSelect = tab.querySelector("#clock-style-select") as HTMLSelectElement;
    styleSelect.addEventListener("change", async () => {
      const val = styleSelect.value as "analog" | "digital";
      const settings = { ...this.state!.settings, clockStyle: val };
      await storageManager.save({ settings });
    });

    // Clock Mode change listener
    const modeSelect = tab.querySelector("#clock-mode-select") as HTMLSelectElement;
    modeSelect.addEventListener("change", async () => {
      const val = modeSelect.value as "12h" | "24h";
      const settings = { ...this.state!.settings, clockMode: val };
      await storageManager.save({ settings });
    });

    // Blur slider change listener
    const blurSlider = tab.querySelector("#blur-slider") as HTMLInputElement;
    const blurVal = tab.querySelector("#blur-val")!;
    blurSlider.addEventListener("input", () => {
      blurVal.textContent = `${blurSlider.value}px`;
    });
    blurSlider.addEventListener("change", async () => {
      const settings = { ...this.state!.settings, blurAmount: parseInt(blurSlider.value, 10) };
      await storageManager.save({ settings });
    });

    // Animation Speed change listener
    const speedSelect = tab.querySelector("#anim-speed-select") as HTMLSelectElement;
    speedSelect.addEventListener("change", async () => {
      const val = speedSelect.value as "slow" | "normal" | "fast";
      const settings = { ...this.state!.settings, animationSpeed: val };
      await storageManager.save({ settings });
    });

    parent.appendChild(tab);
  }

  private renderShortcutsTab(parent: HTMLElement) {
    const tab = document.createElement("div");
    tab.className = "settings-tab-content";
    tab.dataset.tab = "shortcuts";

    tab.innerHTML = `
      <div class="settings-title">HUD Shortcuts</div>
      
      <div class="settings-group">
        <div class="settings-toggle-row">
          <div>
            <div class="settings-label">Left-Edge Hover Trigger</div>
            <div class="settings-desc">Activate the HUD automatically by hovering the far-left screen border.</div>
          </div>
          <div class="settings-toggle ${this.state?.settings.edgeActivation ? "active" : ""}" id="edge-activation-toggle">
            <div class="settings-toggle-thumb"></div>
          </div>
        </div>
      </div>

      <div class="settings-group" style="margin-top:10px;">
        <div class="settings-label">Extension Trigger Key</div>
        <div class="settings-desc" style="margin-bottom:6px;">Bound inside manifest to toggle HUD visibility globally.</div>
        <div class="shortcut-binder" id="shortcut-display">
          ${this.state?.settings.shortcut || "Alt + Space"}
        </div>
        <div class="settings-desc" style="margin-top:4px;font-style:italic;">
          Note: To rebind this extension shortcut globally, navigate to <b style="color:var(--text-secondary)">chrome://extensions/shortcuts</b>.
        </div>
      </div>
    `;

    // Toggle edge activation
    const edgeToggle = tab.querySelector("#edge-activation-toggle")!;
    edgeToggle.addEventListener("click", async () => {
      const settings = { ...this.state!.settings, edgeActivation: !this.state!.settings.edgeActivation };
      await storageManager.save({ settings });
    });

    parent.appendChild(tab);
  }

  private renderAboutTab(parent: HTMLElement) {
    const tab = document.createElement("div");
    tab.className = "settings-tab-content";
    tab.dataset.tab = "about";

    tab.innerHTML = `
      <div class="about-logo-container">
        <div class="about-logo">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </div>
        <div class="settings-title" style="margin-bottom:0px;">eX1 HUD Companion</div>
        <div class="about-version">VERSION 1.0.0</div>
      </div>
      
      <div class="about-credits">
        An instrument-grade HUD AI dashboard overlay. Built for developers, engineers, and power users.
      </div>

      <div class="settings-group" style="gap:10px; margin-top: 10px;">
        <div class="settings-label">Configuration Sync</div>
        <div class="settings-btn-row">
          <button class="settings-btn" id="export-config-btn">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Export JSON
          </button>
          <button class="settings-btn" id="import-config-btn">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Import JSON
          </button>
        </div>
      </div>
    `;

    // Export Config Click
    tab.querySelector("#export-config-btn")!.addEventListener("click", () => {
      if (!this.state) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ex1_config_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Import Config Click
    tab.querySelector("#import-config-btn")!.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      
      fileInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            
            // Basic structure verification
            if (parsed && typeof parsed === "object" && ("theme" in parsed || "settings" in parsed)) {
              await storageManager.save(parsed);
              alert("eX1 HUD Configuration imported successfully!");
            } else {
              alert("Invalid config file structure.");
            }
          } catch (err) {
            alert("Failed to parse configuration file.");
          }
        };
        reader.readAsText(file);
      });

      fileInput.click();
    });

    parent.appendChild(tab);
  }
}
