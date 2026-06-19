import { storageManager, type DockItem, type ExtensionState } from "../../state/storage";

export class BottomDock {
  private element: HTMLElement;
  private dockContainer: HTMLElement;
  private state: ExtensionState | null = null;
  
  // Drag state
  private draggingItem: HTMLElement | null = null;
  private dragItemId: string | null = null;
  private dragStartOffset: number = 0;

  constructor(
    private parent: HTMLElement,
    private showEditModal: (
      title: string,
      fields: { label: string; key: string; value: string }[],
      onConfirm: (data: Record<string, string>) => void
    ) => void,
    private showContextMenu: (
      x: number,
      y: number,
      options: { label: string; action: () => void; danger?: boolean }[]
    ) => void
  ) {
    this.element = document.createElement("div");
    this.element.className = "dock-wrapper";
    this.parent.appendChild(this.element);

    this.dockContainer = document.createElement("div");
    this.dockContainer.className = "dock-container";
    this.element.appendChild(this.dockContainer);

    this.init();
  }

  private async init() {
    this.state = await storageManager.load();
    this.render();

    storageManager.onChange((newState) => {
      this.state = newState;
      this.render();
    });

    this.setupMagnification();
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.element.classList.add("dock-open");
      this.element.classList.add("interactive");
    } else {
      this.element.classList.remove("dock-open");
      this.element.classList.remove("interactive");
    }
  }

  private render() {
    if (!this.state) return;

    this.dockContainer.innerHTML = "";

    const sortedItems = [...this.state.dockItems].sort((a, b) => a.order - b.order);

    sortedItems.forEach((item) => {
      this.createDockItem(item);
    });

    // Plus node at the end to add items directly
    this.createPlusItem();
  }

  private createDockItem(item: DockItem) {
    const itemEl = document.createElement("a");
    itemEl.className = "dock-item";
    itemEl.dataset.id = item.id;
    itemEl.href = item.url;
    itemEl.target = "_blank";
    itemEl.innerHTML = item.icon;

    // Dot indicator if active site
    const dot = document.createElement("div");
    dot.className = "dock-item-dot";
    itemEl.appendChild(dot);

    // Active tab check
    try {
      const currentHost = window.location.hostname;
      const itemHost = new URL(item.url).hostname;
      if (currentHost.includes(itemHost) || itemHost.includes(currentHost)) {
        itemEl.classList.add("active");
      }
    } catch (e) {
      // Invalid URL or local file URL
    }

    // Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "dock-tooltip";
    tooltip.textContent = item.name;
    itemEl.appendChild(tooltip);

    // Click behavior (Left: go to, Middle: background tab, Right: Edit/Delete)
    itemEl.addEventListener("click", (e) => {
      if (itemEl.classList.contains("item-dragging")) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      // Only intercept in real extension context (chrome.runtime.id is undefined on normal pages)
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
        e.preventDefault();
        chrome.runtime.sendMessage({
          action: "open-tab",
          url: item.url,
          active: true
        });
      }
      // Otherwise let native <a href> handle it
    });

    itemEl.addEventListener("auxclick", (e) => {
      if (e.button === 1) { // Middle click
        e.preventDefault();
        e.stopPropagation();
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({
            action: "open-tab",
            url: item.url,
            active: false
          });
        } else {
          window.open(item.url, "_blank");
        }
      }
    });

    itemEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showContextMenu(e.clientX, e.clientY, [
        {
          label: `Edit ${item.name}`,
          action: () => {
            this.showEditModal(
              "Edit Dock Item",
              [
                { label: "Name", key: "name", value: item.name },
                { label: "URL", key: "url", value: item.url }
              ],
              async (data) => {
                if (data.name && data.url) {
                  const updated = this.state!.dockItems.map((d) =>
                    d.id === item.id ? { ...d, name: data.name, url: data.url } : d
                  );
                  await storageManager.save({ dockItems: updated });
                }
              }
            );
          }
        },
        {
          label: "Remove from Dock",
          action: async () => {
            const updated = this.state!.dockItems.filter((d) => d.id !== item.id);
            await storageManager.save({ dockItems: updated });
          },
          danger: true
        }
      ]);
    });

    // Drag-to-reorder (horizontal index swapping)
    itemEl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Left click only
      e.preventDefault();
      e.stopPropagation();

      this.draggingItem = itemEl;
      this.dragItemId = item.id;
      itemEl.classList.add("item-dragging");

      const rect = itemEl.getBoundingClientRect();
      this.dragStartOffset = e.clientX - rect.left;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!this.draggingItem || !this.dragItemId) return;

        // Position item relative to dock container
        const dockRect = this.dockContainer.getBoundingClientRect();
        const relativeX = moveEvent.clientX - dockRect.left - this.dragStartOffset;
        
        // Render item visually in drag position
        this.draggingItem.style.position = "relative";
        this.draggingItem.style.transform = `translateX(${relativeX - itemEl.offsetLeft}px)`;

        // Find which node to swap with
        const children = Array.from(this.dockContainer.querySelectorAll(".dock-item"));
        const dragCenter = moveEvent.clientX;

        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          if (child === this.draggingItem) continue;

          const childRect = child.getBoundingClientRect();
          const childCenter = childRect.left + childRect.width / 2;

          if (Math.abs(dragCenter - childCenter) < childRect.width / 2) {
            const targetId = child.dataset.id;
            if (!targetId) continue;

            const items = [...this.state!.dockItems].sort((a, b) => a.order - b.order);
            const fromIdx = items.findIndex((d) => d.id === this.dragItemId);
            const toIdx = items.findIndex((d) => d.id === targetId);

            if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
              const movingItem = items[fromIdx];
              items.splice(fromIdx, 1);
              items.splice(toIdx, 0, movingItem);

              // Update order indexes
              items.forEach((d, idx) => {
                d.order = idx;
              });

              storageManager.save({ dockItems: items });
            }
            break;
          }
        }
      };

      const onMouseUp = () => {
        if (this.draggingItem) {
          this.draggingItem.classList.remove("item-dragging");
          this.draggingItem.style.transform = "";
          this.draggingItem.style.position = "";
          this.draggingItem = null;
          this.dragItemId = null;
          this.render(); // Reset layout correctly
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    this.dockContainer.appendChild(itemEl);
  }

  private createPlusItem() {
    const plusEl = document.createElement("div");
    plusEl.className = "dock-item";
    plusEl.style.background = "rgba(255,255,255,0.02)";
    plusEl.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    const tooltip = document.createElement("div");
    tooltip.className = "dock-tooltip";
    tooltip.textContent = "Add Link";
    plusEl.appendChild(tooltip);

    plusEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showEditModal(
        "Add Dock Item",
        [
          { label: "Name", key: "name", value: "" },
          { label: "URL", key: "url", value: "https://" }
        ],
        async (data) => {
          if (data.name && data.url) {
            const newId = data.name.toLowerCase().replace(/[^a-z0-9]/g, "") || Date.now().toString();
            const iconSvg = storageManager.getGenericIcon();
            const order = this.state?.dockItems.length || 0;
            
            const newItems = [
              ...this.state!.dockItems,
              { id: newId, name: data.name, url: data.url, icon: iconSvg, order }
            ];
            await storageManager.save({ dockItems: newItems });
          }
        }
      );
    });

    this.dockContainer.appendChild(plusEl);
  }

  private setupMagnification() {
    const maxScale = 1.4;
    const range = 90; // distance range for effect in px

    this.dockContainer.addEventListener("mousemove", (e) => {
      if (this.draggingItem) return; // Disable magnification while dragging

      const items = this.dockContainer.querySelectorAll(".dock-item");
      const mouseX = e.clientX;

      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - center);

        if (distance < range) {
          // Linear scaling from 1.0 to 1.4 based on distance
          const factor = 1 - distance / range;
          const scale = 1 + (maxScale - 1) * factor;
          const size = 44 * scale;
          
          (item as HTMLElement).style.width = `${size}px`;
          (item as HTMLElement).style.height = `${size}px`;
        } else {
          (item as HTMLElement).style.width = "44px";
          (item as HTMLElement).style.height = "44px";
        }
      });
    });

    this.dockContainer.addEventListener("mouseleave", () => {
      const items = this.dockContainer.querySelectorAll(".dock-item");
      items.forEach((item) => {
        (item as HTMLElement).style.width = "44px";
        (item as HTMLElement).style.height = "44px";
      });
    });
  }
}
