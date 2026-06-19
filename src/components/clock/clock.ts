import { storageManager, type ExtensionState } from "../../state/storage";

export class ClockWidget {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private digitalEl: HTMLElement | null = null;
  private dateEl: HTMLElement | null = null;
  private greetingEl: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private state: ExtensionState | null = null;

  constructor(private parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "clock-widget";
    this.parent.appendChild(this.element);
    
    this.init();
  }

  private async init() {
    this.state = await storageManager.load();
    this.render();
    
    storageManager.onChange((newState) => {
      this.state = newState;
      this.render();
    });

    this.startLoop();
  }

  private render() {
    if (!this.state) return;
    
    const style = this.state.settings.clockStyle;
    
    this.element.innerHTML = "";
    this.canvas = null;
    this.digitalEl = null;
    this.dateEl = null;
    this.greetingEl = null;

    if (style === "analog") {
      this.canvas = document.createElement("canvas");
      this.canvas.className = "clock-analog-canvas";
      this.canvas.width = 400;
      this.canvas.height = 400;
      this.element.appendChild(this.canvas);

      // Date below the analog clock
      this.dateEl = document.createElement("div");
      this.dateEl.className = "clock-date";
      this.element.appendChild(this.dateEl);
    } else {
      // Digital mode — large time + greeting + date
      this.greetingEl = document.createElement("div");
      this.greetingEl.className = "clock-greeting";
      this.element.appendChild(this.greetingEl);

      this.digitalEl = document.createElement("div");
      this.digitalEl.className = "clock-digital";
      this.element.appendChild(this.digitalEl);

      this.dateEl = document.createElement("div");
      this.dateEl.className = "clock-date";
      this.element.appendChild(this.dateEl);
    }
  }

  private startLoop() {
    const update = () => {
      this.updateClock();
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.element.remove();
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.element.classList.add("clock-visible");
    } else {
      this.element.classList.remove("clock-visible");
    }
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  }

  private updateClock() {
    if (!this.state) return;
    
    const now = new Date();
    
    // Update greeting
    if (this.greetingEl) {
      this.greetingEl.textContent = this.getGreeting();
    }

    // Update Digital clock
    if (this.digitalEl) {
      const mode = this.state.settings.clockMode;
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      let ampm = "";

      if (mode === "12h") {
        ampm = hours >= 12 ? " PM" : " AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
      }
      
      const hoursStr = String(hours).padStart(2, "0");
      this.digitalEl.textContent = `${hoursStr}:${minutes}${ampm}`;
    }

    // Update Date
    if (this.dateEl) {
      const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
      this.dateEl.textContent = now.toLocaleDateString("en-US", options);
    }

    // Update Analog clock
    if (this.canvas) {
      this.drawAnalogClock(now);
    }
  }

  private drawAnalogClock(date: Date) {
    const canvas = this.canvas!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const radius = canvas.width / 2;
    ctx.save();
    ctx.translate(radius, radius);

    const computedStyles = window.getComputedStyle(this.parent);
    const accentColor = computedStyles.getPropertyValue("--accent").trim() || "#E5E7EB";
    const textSecondary = computedStyles.getPropertyValue("--text-secondary").trim() || "#A1A1AA";
    const borderHairline = computedStyles.getPropertyValue("--border-hairline").trim() || "#1F1F22";

    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, 0, 2 * Math.PI);
    ctx.strokeStyle = borderHairline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tick marks
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI) / 30;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      
      if (i % 5 === 0) {
        // Hour marks
        ctx.moveTo(0, -radius + 8);
        ctx.lineTo(0, -radius + 24);
        ctx.strokeStyle = textSecondary;
        ctx.lineWidth = 2.5;
      } else {
        // Minute marks
        ctx.moveTo(0, -radius + 8);
        ctx.lineTo(0, -radius + 14);
        ctx.strokeStyle = borderHairline;
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      ctx.restore();
    }

    // Hour numbers
    ctx.font = "600 22px Inter, sans-serif";
    ctx.fillStyle = textSecondary;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {
      const numAngle = (i * Math.PI) / 6 - Math.PI / 2;
      const numRadius = radius - 42;
      const nx = numRadius * Math.cos(numAngle);
      const ny = numRadius * Math.sin(numAngle);
      ctx.fillText(String(i), nx, ny);
    }

    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ms = date.getMilliseconds();

    // Hour hand
    const hourAngle = (hours * Math.PI) / 6 + (minutes * Math.PI) / 360;
    this.drawHand(ctx, hourAngle, radius * 0.42, 5, "#FFFFFF");

    // Minute hand
    const minuteAngle = (minutes * Math.PI) / 30 + (seconds * Math.PI) / 1800;
    this.drawHand(ctx, minuteAngle, radius * 0.6, 3, "#D1D5DB");

    // Second hand — smooth sweep
    const secondAngle = ((seconds + ms / 1000) * Math.PI) / 30;
    this.drawHand(ctx, secondAngle, radius * 0.72, 1.5, accentColor);

    // Center pin
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, 2 * Math.PI);
    ctx.fillStyle = accentColor;
    ctx.fill();

    ctx.restore();
  }

  private drawHand(ctx: CanvasRenderingContext2D, angle: number, length: number, width: number, color: string) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, -length);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
}
