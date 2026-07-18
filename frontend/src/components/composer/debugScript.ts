import { LAYOUT_CATALOG } from './layoutSpecs';

const vb = LAYOUT_CATALOG.find(l => l.id === 'system.cover.frac-vb');
console.log('vb imageIndexes:', vb?.regions.filter(r => r.role === 'image').map(r => r.imageIndex));
