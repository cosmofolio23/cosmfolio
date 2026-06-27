export const LAYOUT_VARIANTS = [
  { value: 'list', label: 'Standard List' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'bento', label: 'Bento Grid' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'grid-2', label: '2-Column Grid' },
  { value: 'grid-3', label: '3-Column Grid' },
  { value: 'cards-elevated', label: 'Elevated Cards' },
  { value: 'cards-flat', label: 'Flat Cards' },
  { value: 'cards-outlined', label: 'Outlined Cards' },
  { value: 'minimal', label: 'Ultra Minimal' },
  { value: 'compact', label: 'Compact List' },
  { value: 'expanded', label: 'Expanded Layout' },
  { value: 'modern', label: 'Modern Accent' },
  { value: 'classic', label: 'Classic Serif' },
  { value: 'tech', label: 'Tech Monospace' },
  { value: 'elegant', label: 'Elegant Spaced' },
  { value: 'playful', label: 'Playful Rounded' },
  { value: 'brutal', label: 'Brutalist' },
  { value: 'glass', label: 'Glassmorphism' },
  { value: 'neumorphic', label: 'Neumorphic' },
];

export const BAR_STYLES = [
  { value: 'dots', label: 'Minimal Dots (●●●○○)' },
  { value: 'bars', label: 'Progress Bars' },
  { value: 'text', label: 'Numeric (3/5)' },
  { value: 'none', label: 'Hidden' },
  { value: 'circles', label: 'Hollow Circles (○○○○○)' },
  { value: 'squares', label: 'Squares (■■■□□)' },
  { value: 'diamonds', label: 'Diamonds (◆◆◆◇◇)' },
  { value: 'stars', label: 'Stars (★★★☆☆)' },
  { value: 'dashes', label: 'Dashes (---  )' },
  { value: 'blocks', label: 'Blocks (███░░)' },
  { value: 'percentage', label: 'Percentage (80%)' },
  { value: 'tag', label: 'Tag Badge' },
  { value: 'pill', label: 'Pill Badge' },
  { value: 'outline', label: 'Outline Bar' },
  { value: 'gradient', label: 'Gradient Bar' },
  { value: 'segmented', label: 'Segmented Bar' },
  { value: 'emoji', label: 'Fire/Star Emojis' },
  { value: 'plus', label: 'Plus Signs (+++)' },
  { value: 'slash', label: 'Slashes (///)' },
  { value: 'text-only', label: 'Skill Text Only' },
];

export const DIVIDERS = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid Line' },
  { value: 'dashed', label: 'Dashed Line' },
  { value: 'dotted', label: 'Dotted Line' },
  { value: 'double', label: 'Double Line' },
  { value: 'thick', label: 'Thick Solid' },
  { value: 'gradient', label: 'Gradient Line' },
  { value: 'zigzag', label: 'Zig Zag (CSS)' },
  { value: 'wave', label: 'Wavy Line' },
  { value: 'dots-spaced', label: 'Widely Spaced Dots' },
  { value: 'dashes-spaced', label: 'Widely Spaced Dashes' },
  { value: 'shadow', label: 'Bottom Shadow' },
  { value: 'glow', label: 'Bottom Glow' },
  { value: 'fade', label: 'Faded Edges Line' },
  { value: 'slash-sep', label: 'Slash Separator (///)' },
  { value: 'diamond-sep', label: 'Diamond Center (— ◇ —)' },
  { value: 'star-sep', label: 'Star Center (— ★ —)' },
  { value: 'circle-sep', label: 'Circle Center (— ○ —)' },
  { value: 'square-sep', label: 'Square Center (— □ —)' },
  { value: 'plus-sep', label: 'Plus Center (— + —)' },
];

export function getVariantClasses(variant: string): string {
  switch (variant) {
    case 'bento': return 'bg-black/5 p-4 rounded-xl border border-black/5';
    case 'cards-elevated': return 'bg-white p-4 rounded-xl shadow-lg border border-black/5';
    case 'cards-flat': return 'bg-gray-50 p-4 rounded-xl';
    case 'cards-outlined': return 'bg-transparent p-4 rounded-xl border-2 border-black/10';
    case 'minimal': return 'px-2 border-l-2 border-black/10';
    case 'compact': return 'leading-tight -tracking-tight text-sm';
    case 'expanded': return 'p-6 leading-loose text-lg tracking-wide';
    case 'modern': return 'border-l-4 border-blue-500 pl-4 bg-blue-50/30 py-2';
    case 'classic': return 'font-serif tracking-wide';
    case 'tech': return 'font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-sm';
    case 'elegant': return 'border-y border-black/10 py-4 uppercase tracking-widest text-sm';
    case 'playful': return 'rounded-full px-6 py-2 bg-yellow-100 border-2 border-yellow-300 shadow-[4px_4px_0_0_rgba(0,0,0,1)]';
    case 'brutal': return 'border-4 border-black p-4 bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] font-bold';
    case 'glass': return 'bg-white/30 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-xl';
    case 'neumorphic': return 'bg-gray-100 p-4 rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,1)]';
    default: return ''; // list, timeline, masonry, grid-2, grid-3 handled structurally
  }
}

export function getDividerClasses(divider: string): string {
  switch (divider) {
    case 'solid': return 'border-b border-black/10 pb-4';
    case 'dashed': return 'border-b border-dashed border-black/15 pb-4';
    case 'dotted': return 'border-b-2 border-dotted border-black/20 pb-4';
    case 'double': return 'border-b-4 border-double border-black/10 pb-4';
    case 'thick': return 'border-b-4 border-black/20 pb-4';
    case 'gradient': return 'pb-4 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-black/20 after:to-transparent';
    case 'zigzag': return 'pb-4 border-b-2 border-dashed border-red-500'; // simplified
    case 'wave': return 'pb-4 border-b-[3px] border-blue-300'; 
    case 'dots-spaced': return 'pb-4 border-b-4 border-dotted border-black/10';
    case 'dashes-spaced': return 'pb-4 border-b-4 border-dashed border-black/10';
    case 'shadow': return 'pb-4 shadow-[0_4px_6px_-6px_rgba(0,0,0,0.3)]';
    case 'glow': return 'pb-4 shadow-[0_4px_15px_-3px_rgba(59,130,246,0.3)] border-b border-blue-100';
    case 'fade': return 'pb-4 border-b border-black/10 opacity-70';
    case 'slash-sep': return 'pb-4 relative after:content-["///"] after:absolute after:-bottom-2.5 after:left-1/2 after:-translate-x-1/2 after:text-xs after:text-black/20 after:font-mono after:bg-white after:px-2';
    case 'diamond-sep': return 'pb-4 relative border-b border-black/10 after:content-["◇"] after:absolute after:-bottom-[11px] after:left-1/2 after:-translate-x-1/2 after:text-black/30 after:bg-white after:px-2';
    case 'star-sep': return 'pb-4 relative border-b border-black/10 after:content-["★"] after:absolute after:-bottom-[11px] after:left-1/2 after:-translate-x-1/2 after:text-black/30 after:bg-white after:px-2';
    case 'circle-sep': return 'pb-4 relative border-b border-black/10 after:content-["○"] after:absolute after:-bottom-[11px] after:left-1/2 after:-translate-x-1/2 after:text-black/30 after:bg-white after:px-2';
    case 'square-sep': return 'pb-4 relative border-b border-black/10 after:content-["□"] after:absolute after:-bottom-[11px] after:left-1/2 after:-translate-x-1/2 after:text-black/30 after:bg-white after:px-2';
    case 'plus-sep': return 'pb-4 relative border-b border-black/10 after:content-["+"] after:absolute after:-bottom-[11px] after:left-1/2 after:-translate-x-1/2 after:text-black/30 after:bg-white after:px-2';
    default: return '';
  }
}
