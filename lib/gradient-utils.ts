// Server-safe gradient generation from seed strings
// Creates unique gradient photos per item without real images

type GradientPalette = [string, string, string, string]; // [color1, color2, color3, color4]

const GRADIENT_PALETTES: GradientPalette[] = [
  // Gold/amber — collector rank, common statues
  ['#C68B59', '#D4A574', '#E8C396', '#A66E3A'],
  // Blue/cobalt — rare, XM signature
  ['#1A5276', '#2E86C1', '#5DADE2', '#154360'],
  // Purple/violet — ultra rare, mystical
  ['#4A235A', '#7D3C98', '#AF7AC5', '#2C0B3A'],
  // Deep crimson — legendary, premium
  ['#641E16', '#922B21', '#E74C3C', '#4A0E0E'],
  // Emerald/teal — e-tickets, success, nature themes
  ['#0B5345', '#1ABC9C', '#48C9B0', '#052F2A'],
  // Slate/charcoal — common, dark
  ['#2C3E50', '#5D6D7E', '#85929E', '#1B2631'],
  // Rose gold — special editions
  ['#6C3483', '#C39BD3', '#F1948A', '#4A235A'],
  // Ocean — aquatic IPs
  ['#0E4D64', '#2196F3', '#4FC3F7', '#073042'],
  // Sunset — warm theme statues
  ['#B8600E', '#E67E22', '#F39C12', '#7A3B00'],
  // Forest — nature IPs
  ['#1B5E20', '#388E3C', '#66BB6A', '#0D3310'],
  // Steel — mecha/robot IPs
  ['#37474F', '#607D8B', '#90A4AE', '#1C2529'],
  // Midnight — dark premium
  ['#1A1A2E', '#16213E', '#0F3460', '#0A0A15'],
  // Arctic — ice/crystal
  ['#AED6F1', '#D6EAF8', '#E8F6F3', '#85C1E9'],
  // Bronze — bronze rank
  ['#A0522D', '#CD853F', '#DEB887', '#6B3410'],
  // Magenta — special/limited
  ['#880E4F', '#C2185B', '#E91E63', '#4A0023'],
];

// Simple string hash for deterministic palette selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate a unique gradient CSS string from a seed string (e.g., product name)
export function getGradientCSS(seed: string, type: 'card' | 'eticket' | 'product' = 'card'): string {
  const h = hashString(seed);
  const paletteIdx = h % GRADIENT_PALETTES.length;
  const palette = GRADIENT_PALETTES[paletteIdx];
  const [c1, c2, c3, c4] = palette;

  // Use hash components for angle and stop positions
  const angle = (h % 180) + 135; // 135-315 degrees
  const overlayOpacity = 0.15 + (h % 5) * 0.02; // 0.15-0.23

  // Radial spotlight for depth
  const spotlightX = 20 + (h % 60); // 20-80%
  const spotlightY = 20 + ((h >> 4) % 60); // 20-80%

  // Create a rich multi-layer gradient that looks like a stylized photo
  return `
    radial-gradient(
      circle at ${spotlightX}% ${spotlightY}%,
      rgba(255, 255, 255, ${overlayOpacity}) 0%,
      transparent 60%
    ),
    linear-gradient(${angle}deg,
      ${c1} 0%,
      ${c2} 25%,
      ${c3} 50%,
      ${c4} 75%,
      ${c1} 100%
    )
  `;
}

// Get a deterministic accent color from a seed
export function getGradientAccent(seed: string): string {
  const h = hashString(seed);
  const paletteIdx = h % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[paletteIdx][1]; // Second color as accent
}

// Server component: renders a gradient image div with product name overlay
// style={{ background: getGradientCSS(name) }}
