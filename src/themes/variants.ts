export interface Theme {
  id: string;
  name: string;
  accent: string;
  accentMuted: string;
  description: string;
}

export const THEMES: Theme[] = [
  {
    id: "obsidian-platinum",
    name: "Obsidian Platinum",
    accent: "#E5E7EB",
    accentMuted: "#9CA3AF",
    description: "Neutral, clinical, default-safe"
  },
  {
    id: "obsidian-sapphire",
    name: "Obsidian Sapphire",
    accent: "#2452FF",
    accentMuted: "#0B1A4D",
    description: "Authoritative cyber-cell sapphire blue"
  },
  {
    id: "obsidian-crimson",
    name: "Obsidian Crimson",
    accent: "#C81E3A",
    accentMuted: "#3D0B14",
    description: "High-seriousness alert-grade crimson"
  },
  {
    id: "obsidian-gold",
    name: "Obsidian Gold",
    accent: "#C9A24B",
    accentMuted: "#3A2E14",
    description: "Premium executive concierge gold"
  },
  {
    id: "obsidian-emerald",
    name: "Obsidian Emerald",
    accent: "#1E8F5E",
    accentMuted: "#0C2D1E",
    description: "Analytical terminal-grade emerald"
  },
  {
    id: "obsidian-violet",
    name: "Obsidian Violet",
    accent: "#7C5CFF",
    accentMuted: "#241A4D",
    description: "Creative modern deep violet"
  }
];
