import { storageManager, type AITool, type ExtensionState } from "../../state/storage";

export class AIWheel {
  private element: HTMLElement;
  private semiCircle: HTMLElement;
  private state: ExtensionState | null = null;
  
  // Drag state
  private draggingNode: HTMLElement | null = null;
  private dragToolId: string | null = null;
  private nodeAngles: Map<string, number> = new Map(); // tracks current angles for drag swapping

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
    this.element.className = "wheel-container";
    this.parent.appendChild(this.element);

    this.semiCircle = document.createElement("div");
    this.semiCircle.className = "wheel-semi";
    this.element.appendChild(this.semiCircle);

    // Center Trigger button inside the wheel
    const centerTrigger = document.createElement("div");
    centerTrigger.className = "wheel-center-trigger interactive";
    centerTrigger.innerHTML = "<span>AI</span>";
    this.semiCircle.appendChild(centerTrigger);

    this.init();
  }

  private async init() {
    this.state = await storageManager.load();
    this.render();

    // Re-render when theme or list changes
    storageManager.onChange((newState) => {
      this.state = newState;
      this.render();
    });
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.element.classList.add("wheel-open");
      this.element.classList.add("interactive");
    } else {
      this.element.classList.remove("wheel-open");
      this.element.classList.remove("interactive");
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private render() {
    if (!this.state) return;

    // Clear nodes except the center trigger
    const nodes = this.semiCircle.querySelectorAll(".wheel-node");
    nodes.forEach(n => n.remove());

    const activeTools = this.state.aiTools
      .filter((t) => t.pinned)
      .sort((a, b) => a.order - b.order);

    const N = activeTools.length;
    if (N === 0) return;

    // Radius for node placement
    const radius = 200; 
    
    // Distribute nodes along a semicircular arc on the right side of the left edge
    // Angle runs from -Math.PI / 2 + padding to Math.PI / 2 - padding
    const padding = 0.25; // padding from exact top/bottom to look cleaner
    const startAngle = -Math.PI / 2 + padding;
    const endAngle = Math.PI / 2 - padding;
    const angleRange = endAngle - startAngle;

    activeTools.forEach((tool, index) => {
      // Calculate angle for this node
      const angle = N > 1 
        ? startAngle + (index / (N - 1)) * angleRange
        : 0;

      this.nodeAngles.set(tool.id, angle);
      this.createNode(tool, angle, radius);
    });
  }

  private createNode(tool: AITool, angle: number, radius: number) {
    const node = document.createElement("a");
    node.className = "wheel-node";
    node.dataset.id = tool.id;
    node.href = tool.url;
    node.target = "_blank";

    // Position using polar coordinates relative to center of the semi-circle
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    // We add 250px to X because the circle center is at left: -250px (so x=0 is page edge, center is at x=250 in the container)
    const posX = 250 + x - 22; // subtract half node width (44/2)
    const posY = 250 + y - 22; // subtract half node height (44/2)

    node.style.left = `${posX}px`;
    node.style.top = `${posY}px`;
    node.style.setProperty("--node-x", `${x}px`);
    node.style.setProperty("--node-y", `${y}px`);

    node.innerHTML = tool.icon;

    // Node Name Label on Hover
    const label = document.createElement("div");
    label.className = "wheel-node-label";
    label.textContent = tool.name;
    node.appendChild(label);

    // Left click -> Open link (native <a> href handles localhost; sendMessage handles extension)
    node.addEventListener("click", (e) => {
      if (node.classList.contains("node-dragging")) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      // Only intercept in real extension context (chrome.runtime.id is undefined on normal pages)
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
        e.preventDefault();
        chrome.runtime.sendMessage({
          action: "open-tab",
          url: tool.url,
          active: true
        });
      }
      // Otherwise let native <a href> handle it
    });

    // Middle click -> Open in background
    node.addEventListener("auxclick", (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({
            action: "open-tab",
            url: tool.url,
            active: false
          });
        } else {
          window.open(tool.url, "_blank");
        }
      }
    });

    // Right click -> Context menu (edit / delete / pin)
    node.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.showContextMenu(e.clientX, e.clientY, [
        {
          label: `Edit ${tool.name}`,
          action: () => {
            this.showEditModal(
              `Edit AI Tool`,
              [
                { label: "Name", key: "name", value: tool.name },
                { label: "URL", key: "url", value: tool.url }
              ],
              async (data) => {
                if (data.name && data.url) {
                  const updatedTools = this.state!.aiTools.map((t) =>
                    t.id === tool.id ? { ...t, name: data.name, url: data.url } : t
                  );
                  await storageManager.save({ aiTools: updatedTools });
                }
              }
            );
          }
        },
        {
          label: "Unpin from Wheel",
          action: async () => {
            const updatedTools = this.state!.aiTools.map((t) =>
              t.id === tool.id ? { ...t, pinned: false } : t
            );
            await storageManager.save({ aiTools: updatedTools });
          },
          danger: true
        }
      ]);
    });

    // Drag and Drop (math-based angular sort)
    node.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only left click drag
      e.preventDefault();
      e.stopPropagation();

      this.draggingNode = node;
      this.dragToolId = tool.id;
      node.classList.add("node-dragging");

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!this.draggingNode || !this.dragToolId) return;

        // Calculate position relative to center of circle (which is at page left:0, middle of wheel height: top + 250px)
        const rect = this.semiCircle.getBoundingClientRect();
        const centerX = rect.left; // left edge of page
        const centerY = rect.top + rect.height / 2;

        const deltaX = moveEvent.clientX - centerX;
        const deltaY = moveEvent.clientY - centerY;

        // Rotate polar coordinate to match the vertical semicircle (-90 to +90 degrees)
        const angle = Math.atan2(deltaY, deltaX);

        // Move the node visually
        // Cap the distance to radius
        const currentRadius = Math.max(120, Math.min(250, Math.sqrt(deltaX * deltaX + deltaY * deltaY)));
        const newX = 250 + currentRadius * Math.cos(angle) - 22;
        const newY = 250 + currentRadius * Math.sin(angle) - 22;
        
        this.draggingNode.style.left = `${newX}px`;
        this.draggingNode.style.top = `${newY}px`;

        // Find which node to swap with based on current angle
        const activeTools = this.state!.aiTools
          .filter((t) => t.pinned)
          .sort((a, b) => a.order - b.order);

        // Sort other active tools by their initial preset angles to find where the drag angle lies
        const sortedByAngle = [...activeTools].sort((a, b) => {
          const angleA = this.nodeAngles.get(a.id) || 0;
          const angleB = this.nodeAngles.get(b.id) || 0;
          return angleA - angleB;
        });

        // Determine target position in array based on current angle
        let targetIndex = 0;
        for (let i = 0; i < sortedByAngle.length; i++) {
          const itemAngle = this.nodeAngles.get(sortedByAngle[i].id) || 0;
          if (angle > itemAngle) {
            targetIndex = i + 1;
          }
        }
        targetIndex = Math.max(0, Math.min(activeTools.length - 1, targetIndex));

        const currentIndex = activeTools.findIndex((t) => t.id === this.dragToolId);
        if (currentIndex !== targetIndex && currentIndex !== -1) {
          // Swap orders in state!
          const itemToMove = activeTools[currentIndex];
          activeTools.splice(currentIndex, 1);
          activeTools.splice(targetIndex, 0, itemToMove);
          
          // Re-assign order numbers
          activeTools.forEach((item, idx) => {
            item.order = idx;
          });

          // Save state (renders automatically)
          const allTools = this.state!.aiTools.map((t) => {
            const activeMatch = activeTools.find((at) => at.id === t.id);
            return activeMatch ? { ...t, order: activeMatch.order } : t;
          });
          
          storageManager.save({ aiTools: allTools });
        }
      };

      const onMouseUp = () => {
        if (this.draggingNode) {
          this.draggingNode.classList.remove("node-dragging");
          this.draggingNode = null;
          this.dragToolId = null;
          this.render(); // Snap back to final position
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    this.semiCircle.appendChild(node);
  }
}
