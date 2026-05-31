/**
 * SheetEditor — WYSIWYG drag-drop presentation sheet editor
 * Phase 8: Task 8.2
 *
 * Features:
 *  - Drag-and-drop element positioning
 *  - Snap-to-grid alignment (configurable)
 *  - Layer management (z-order, visibility, lock)
 *  - Real-time iframe / canvas preview
 *  - Undo / Redo (history stack)
 *  - Auto-save (debounced 1.5 s)
 *  - Keyboard shortcuts
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Lock,
  LockOpen,
  Minus,
  Plus,
  Redo,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  Type,
  Undo,
} from 'lucide-react';
import './SheetEditor.css';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ElementKind = 'image' | 'text' | 'title' | 'caption' | 'label'
  | 'divider' | 'north_arrow' | 'scale_bar' | 'page_number' | 'placeholder';

export interface SheetElement {
  id:       string;
  kind:     ElementKind;
  x:        number;   // % of sheet width
  y:        number;   // % of sheet height
  w:        number;   // % of sheet width
  h:        number;   // % of sheet height
  z:        number;   // layer order
  content:  string;
  src?:     string;   // image URL
  locked:   boolean;
  visible:  boolean;
  style:    ElementStyle;
}

export interface ElementStyle {
  fontSize?:   number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  color?:      string;
  bgColor?:    string;
  textAlign?:  'left' | 'center' | 'right';
  padding?:    number;
  borderTop?:  boolean;
  opacity?:    number;
}

export interface SheetState {
  id:          string;
  title:       string;
  templateId:  string;
  pageSize:    'A1' | 'A2' | 'A3' | 'A4';
  orientation: 'landscape' | 'portrait';
  gridColumns: 5 | 8 | 12;
  gridRows:    number;
  snapToGrid:  boolean;
  elements:    SheetElement[];
  selectedIds: string[];
  history:     SheetElement[][];   // undo stack (snapshots)
  future:      SheetElement[][];   // redo stack
  isDirty:     boolean;
  lastSaved:   string | null;
}

// ─────────────────────────────────────────────────────────────
// REDUCER
// ─────────────────────────────────────────────────────────────

type Action =
  | { type: 'SELECT';        ids: string[] }
  | { type: 'ADD_ELEMENT';   el: SheetElement }
  | { type: 'UPDATE_ELEMENT';id: string; patch: Partial<SheetElement> }
  | { type: 'DELETE_ELEMENT';id: string }
  | { type: 'MOVE';          id: string; dx: number; dy: number }
  | { type: 'RESIZE';        id: string; dw: number; dh: number }
  | { type: 'REORDER';       id: string; dir: 'up' | 'down' | 'top' | 'bottom' }
  | { type: 'DUPLICATE';     id: string }
  | { type: 'TOGGLE_LOCK';   id: string }
  | { type: 'TOGGLE_VISIBLE';id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'MARK_SAVED';    ts: string }
  | { type: 'SET_TITLE';     title: string }
  | { type: 'LOAD_SHEET';    sheet: Partial<SheetState> };

const MAX_HISTORY = 50;

function pushHistory(state: SheetState): SheetState {
  const history = [
    ...state.history.slice(-(MAX_HISTORY - 1)),
    [...state.elements],
  ];
  return { ...state, history, future: [], isDirty: true };
}

function snapValue(v: number, gridPct: number, snap: boolean): number {
  if (!snap || gridPct <= 0) return v;
  return Math.round(v / gridPct) * gridPct;
}

function reducer(state: SheetState, action: Action): SheetState {
  switch (action.type) {

    case 'SELECT':
      return { ...state, selectedIds: action.ids };

    case 'ADD_ELEMENT': {
      const next = pushHistory(state);
      return { ...next, elements: [...next.elements, action.el] };
    }

    case 'UPDATE_ELEMENT': {
      const next = pushHistory(state);
      return {
        ...next,
        elements: next.elements.map(e =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    }

    case 'DELETE_ELEMENT': {
      const next = pushHistory(state);
      return {
        ...next,
        elements: next.elements.filter(e => e.id !== action.id),
        selectedIds: next.selectedIds.filter(id => id !== action.id),
      };
    }

    case 'MOVE': {
      const el = state.elements.find(e => e.id === action.id);
      if (!el || el.locked) return state;
      const gridPctX = 100 / state.gridColumns;
      const gridPctY = 100 / state.gridRows;
      const newX = Math.max(0, Math.min(100 - el.w,
        snapValue(el.x + action.dx, gridPctX, state.snapToGrid)));
      const newY = Math.max(0, Math.min(100 - el.h,
        snapValue(el.y + action.dy, gridPctY, state.snapToGrid)));
      const next = pushHistory(state);
      return {
        ...next,
        elements: next.elements.map(e =>
          e.id === action.id ? { ...e, x: newX, y: newY } : e,
        ),
      };
    }

    case 'RESIZE': {
      const el = state.elements.find(e => e.id === action.id);
      if (!el || el.locked) return state;
      const newW = Math.max(5, Math.min(100, el.w + action.dw));
      const newH = Math.max(5, Math.min(100, el.h + action.dh));
      const next = pushHistory(state);
      return {
        ...next,
        elements: next.elements.map(e =>
          e.id === action.id ? { ...e, w: newW, h: newH } : e,
        ),
      };
    }

    case 'REORDER': {
      const sorted = [...state.elements].sort((a, b) => a.z - b.z);
      const idx    = sorted.findIndex(e => e.id === action.id);
      if (idx === -1) return state;

      const reassign = (arr: SheetElement[]) =>
        arr.map((e, i) => ({ ...e, z: i + 1 }));

      let reordered: SheetElement[];
      if (action.dir === 'top') {
        const el = sorted.splice(idx, 1)[0];
        reordered = [...sorted, el];
      } else if (action.dir === 'bottom') {
        const el = sorted.splice(idx, 1)[0];
        reordered = [el, ...sorted];
      } else if (action.dir === 'up' && idx < sorted.length - 1) {
        [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
        reordered = sorted;
      } else if (action.dir === 'down' && idx > 0) {
        [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
        reordered = sorted;
      } else {
        return state;
      }

      const next = pushHistory(state);
      return { ...next, elements: reassign(reordered) };
    }

    case 'DUPLICATE': {
      const src = state.elements.find(e => e.id === action.id);
      if (!src) return state;
      const clone: SheetElement = {
        ...src,
        id: `el_${Date.now()}`,
        x:  src.x + 2,
        y:  src.y + 2,
        z:  Math.max(...state.elements.map(e => e.z)) + 1,
      };
      const next = pushHistory(state);
      return { ...next, elements: [...next.elements, clone] };
    }

    case 'TOGGLE_LOCK':
      return {
        ...state,
        elements: state.elements.map(e =>
          e.id === action.id ? { ...e, locked: !e.locked } : e,
        ),
      };

    case 'TOGGLE_VISIBLE':
      return {
        ...state,
        elements: state.elements.map(e =>
          e.id === action.id ? { ...e, visible: !e.visible } : e,
        ),
      };

    case 'UNDO': {
      if (!state.history.length) return state;
      const prev    = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const future  = [[...state.elements], ...state.future].slice(0, MAX_HISTORY);
      return { ...state, elements: prev, history, future, isDirty: true };
    }

    case 'REDO': {
      if (!state.future.length) return state;
      const [next, ...future] = state.future;
      const history = [...state.history, [...state.elements]];
      return { ...state, elements: next, history, future, isDirty: true };
    }

    case 'TOGGLE_SNAP':
      return { ...state, snapToGrid: !state.snapToGrid };

    case 'MARK_SAVED':
      return { ...state, isDirty: false, lastSaved: action.ts };

    case 'SET_TITLE':
      return { ...state, title: action.title, isDirty: true };

    case 'LOAD_SHEET':
      return { ...state, ...action.sheet, isDirty: false, history: [], future: [] };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────

function makeInitialState(sheetId: string): SheetState {
  return {
    id:          sheetId,
    title:       'Untitled Sheet',
    templateId:  '',
    pageSize:    'A2',
    orientation: 'landscape',
    gridColumns: 12,
    gridRows:    8,
    snapToGrid:  true,
    elements:    [],
    selectedIds: [],
    history:     [],
    future:      [],
    isDirty:     false,
    lastSaved:   null,
  };
}

// ─────────────────────────────────────────────────────────────
// SHEET EDITOR COMPONENT
// ─────────────────────────────────────────────────────────────

interface SheetEditorProps {
  sheetId:    string;
  projectId:  string;
  onExport?:  (format: 'pdf' | 'png') => void;
  onClose?:   () => void;
}

const SheetEditor: React.FC<SheetEditorProps> = ({
  sheetId,
  projectId,
  onExport,
  onClose,
}) => {
  const [state, dispatch] = useReducer(reducer, sheetId, makeInitialState);
  const [zoom,   setZoom]   = useState(75);    // %
  const [panel,  setPanel]  = useState<'layers' | 'properties' | null>('layers');
  const [saving, setSaving] = useState(false);

  const canvasRef   = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── aspect ratio of the sheet on screen ───
  const canvasAspect = useMemo(() => {
    const sizes: Record<string, [number, number]> = {
      A1: [841, 1189], A2: [594, 841], A3: [420, 594], A4: [210, 297],
    };
    const [w, h] = sizes[state.pageSize] ?? [594, 841];
    return state.orientation === 'landscape' ? h / w : w / h;
  }, [state.pageSize, state.orientation]);

  // ── auto-save ──────────────────────────────
  useEffect(() => {
    if (!state.isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void save(), 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state.elements, state.title, state.isDirty]);

  // ── keyboard shortcuts ────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      if (ctrl && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (ctrl && e.key === 's') { e.preventDefault(); void save(); }
      if (e.key === 'Delete' && state.selectedIds.length) {
        state.selectedIds.forEach(id => dispatch({ type: 'DELETE_ELEMENT', id }));
      }
      if (ctrl && e.key === 'd' && state.selectedIds[0]) {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE', id: state.selectedIds[0] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.selectedIds]);

  // ── save ──────────────────────────────────
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/sheets/${sheetId}`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          title:    state.title,
          content:  { elements: state.elements },
          page_size: state.pageSize,
        }),
      });
      dispatch({ type: 'MARK_SAVED', ts: new Date().toISOString() });
    } finally {
      setSaving(false);
    }
  }, [sheetId, state]);

  // ── drag-drop on canvas ───────────────────
  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xPct = ((e.clientX - rect.left) / rect.width)  * 100;
    const yPct = ((e.clientY - rect.top)  / rect.height) * 100;
    const kind = e.dataTransfer.getData('elementKind') as ElementKind;

    if (!kind) return;

    const el: SheetElement = {
      id:      `el_${Date.now()}`,
      kind,
      x:       Math.max(0, xPct - 10),
      y:       Math.max(0, yPct - 5),
      w:       20,
      h:       15,
      z:       (state.elements.length) + 1,
      content: kind === 'text' ? 'Enter text…' : '',
      locked:  false,
      visible: true,
      style:   {},
    };
    dispatch({ type: 'ADD_ELEMENT', el });
  }, [state.elements.length]);

  // ── element drag inside canvas ────────────
  const startDrag = useCallback((
    e: React.MouseEvent,
    id: string,
  ) => {
    e.stopPropagation();
    const el = state.elements.find(el => el.id === id);
    if (!el || el.locked) return;

    dispatch({ type: 'SELECT', ids: [id] });

    const rect   = canvasRef.current!.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (mv: MouseEvent) => {
      const dx = ((mv.clientX - startX) / rect.width)  * 100;
      const dy = ((mv.clientY - startY) / rect.height) * 100;
      dispatch({ type: 'MOVE', id, dx, dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [state.elements]);

  // ── sorted elements (by z) ────────────────
  const sortedElements = useMemo(
    () => [...state.elements].sort((a, b) => a.z - b.z),
    [state.elements],
  );

  const selected = state.selectedIds[0]
    ? state.elements.find(e => e.id === state.selectedIds[0]) ?? null
    : null;

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="sheet-editor">

      {/* ── TOP BAR ── */}
      <header className="se-topbar">
        <div className="se-topbar-left">
          <button className="se-btn-icon" onClick={onClose} title="Close">✕</button>
          <input
            className="se-title-input"
            value={state.title}
            onChange={e => dispatch({ type: 'SET_TITLE', title: e.target.value })}
          />
          <span className="se-save-status">
            {saving ? 'Saving…' : state.isDirty ? 'Unsaved' : `Saved ${state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString() : ''}`}
          </span>
        </div>

        <div className="se-topbar-center">
          <button className="se-btn-icon" title="Undo (Ctrl+Z)"
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={!state.history.length}>
            <Undo size={16} />
          </button>
          <button className="se-btn-icon" title="Redo (Ctrl+Y)"
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={!state.future.length}>
            <Redo size={16} />
          </button>
          <div className="se-divider-v" />
          <button className={`se-btn-icon ${state.snapToGrid ? 'active' : ''}`}
            title="Snap to grid"
            onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}>
            <Grid size={16} />
          </button>
          <div className="se-divider-v" />
          <button className="se-btn-icon" title="Zoom out"
            onClick={() => setZoom(z => Math.max(25, z - 10))}>
            <Minus size={16} />
          </button>
          <span className="se-zoom-label">{zoom}%</span>
          <button className="se-btn-icon" title="Zoom in"
            onClick={() => setZoom(z => Math.min(150, z + 10))}>
            <Plus size={16} />
          </button>
          <button className="se-btn-icon" title="Reset zoom"
            onClick={() => setZoom(75)}>
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="se-topbar-right">
          <button className="se-btn-icon" title="Save (Ctrl+S)" onClick={() => void save()}>
            <Save size={16} />
          </button>
          <button className="se-btn" onClick={() => onExport?.('pdf')}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </header>

      <div className="se-body">

        {/* ── LEFT PANEL: element palette ── */}
        <aside className="se-palette">
          <p className="se-panel-heading">Elements</p>
          {([
            ['image',      '🖼',  'Image'],
            ['title',      'T',   'Title'],
            ['text',       '¶',   'Text'],
            ['caption',    'c',   'Caption'],
            ['label',      'L',   'Label'],
            ['divider',    '—',   'Divider'],
            ['north_arrow','↑N',  'North Arrow'],
            ['scale_bar',  '⊨',   'Scale Bar'],
            ['page_number','#',   'Page No.'],
          ] as [ElementKind, string, string][]).map(([kind, icon, label]) => (
            <div
              key={kind}
              className="se-palette-item"
              draggable
              onDragStart={e => e.dataTransfer.setData('elementKind', kind)}
            >
              <span className="se-palette-icon">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </aside>

        {/* ── CANVAS ── */}
        <main className="se-canvas-wrap">
          <div
            className="se-canvas"
            ref={canvasRef}
            style={{
              width:       `${zoom}%`,
              aspectRatio: `1 / ${canvasAspect}`,
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleCanvasDrop}
            onClick={() => dispatch({ type: 'SELECT', ids: [] })}
          >
            {/* Grid overlay */}
            {state.snapToGrid && (
              <div
                className="se-grid-overlay"
                style={{
                  backgroundSize: `${100 / state.gridColumns}% ${100 / state.gridRows}%`,
                }}
              />
            )}

            {/* Rendered elements */}
            {sortedElements.map(el => (
              el.visible && (
                <div
                  key={el.id}
                  className={`se-element se-element--${el.kind}${state.selectedIds.includes(el.id) ? ' selected' : ''}${el.locked ? ' locked' : ''}`}
                  style={{
                    left:    `${el.x}%`,
                    top:     `${el.y}%`,
                    width:   `${el.w}%`,
                    height:  `${el.h}%`,
                    zIndex:  el.z,
                    opacity: el.style.opacity ?? 1,
                    fontSize:   el.style.fontSize ? `${el.style.fontSize * (zoom / 100)}px` : undefined,
                    fontWeight: el.style.fontWeight,
                    color:      el.style.color,
                    background: el.style.bgColor,
                    textAlign:  el.style.textAlign,
                  }}
                  onMouseDown={e => startDrag(e, el.id)}
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'SELECT', ids: [el.id] }); }}
                >
                  {el.kind === 'image' && el.src
                    ? <img src={el.src} alt={el.content} draggable={false} />
                    : el.kind === 'image'
                    ? <div className="se-img-placeholder">{el.content || 'Drop image here'}</div>
                    : <span>{el.content}</span>
                  }

                  {/* Resize handle */}
                  {state.selectedIds.includes(el.id) && !el.locked && (
                    <div
                      className="se-resize-handle"
                      onMouseDown={e => {
                        e.stopPropagation();
                        const rect  = canvasRef.current!.getBoundingClientRect();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const onMove = (mv: MouseEvent) => {
                          const dw = ((mv.clientX - startX) / rect.width)  * 100;
                          const dh = ((mv.clientY - startY) / rect.height) * 100;
                          dispatch({ type: 'RESIZE', id: el.id, dw, dh });
                        };
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup',   onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup',   onUp);
                      }}
                    />
                  )}
                </div>
              )
            ))}
          </div>
        </main>

        {/* ── RIGHT PANEL: layers / properties ── */}
        <aside className="se-rightpanel">
          <div className="se-panel-tabs">
            <button
              className={panel === 'layers' ? 'active' : ''}
              onClick={() => setPanel('layers')}>
              <Layers size={14} /> Layers
            </button>
            <button
              className={panel === 'properties' ? 'active' : ''}
              onClick={() => setPanel('properties')}>
              <Settings size={14} /> Properties
            </button>
          </div>

          {panel === 'layers' && (
            <div className="se-layers">
              {[...sortedElements].reverse().map(el => (
                <div
                  key={el.id}
                  className={`se-layer-row${state.selectedIds.includes(el.id) ? ' active' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT', ids: [el.id] })}
                >
                  <span className="se-layer-icon">
                    {el.kind === 'image' ? '🖼' : el.kind === 'title' ? 'T' : '¶'}
                  </span>
                  <span className="se-layer-name">{el.content.slice(0, 20) || el.kind}</span>
                  <span className="se-layer-actions">
                    <button title="Toggle visibility"
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_VISIBLE', id: el.id }); }}>
                      {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button title="Toggle lock"
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LOCK', id: el.id }); }}>
                      {el.locked ? <Lock size={12} /> : <LockOpen size={12} />}
                    </button>
                    <button title="Duplicate"
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'DUPLICATE', id: el.id }); }}>
                      <Copy size={12} />
                    </button>
                    <button title="Delete"
                      onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_ELEMENT', id: el.id }); }}>
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {panel === 'properties' && selected && (
            <div className="se-properties">
              <p className="se-panel-heading">Element Properties</p>

              <label>Content</label>
              <textarea
                value={selected.content}
                onChange={e => dispatch({
                  type: 'UPDATE_ELEMENT',
                  id:   selected.id,
                  patch: { content: e.target.value },
                })}
              />

              <label>Font size</label>
              <input
                type="number" min={8} max={200}
                value={selected.style.fontSize ?? 16}
                onChange={e => dispatch({
                  type: 'UPDATE_ELEMENT',
                  id:   selected.id,
                  patch: { style: { ...selected.style, fontSize: +e.target.value } },
                })}
              />

              <label>Color</label>
              <input
                type="color"
                value={selected.style.color ?? '#000000'}
                onChange={e => dispatch({
                  type: 'UPDATE_ELEMENT',
                  id:   selected.id,
                  patch: { style: { ...selected.style, color: e.target.value } },
                })}
              />

              <label>Text align</label>
              <select
                value={selected.style.textAlign ?? 'left'}
                onChange={e => dispatch({
                  type: 'UPDATE_ELEMENT',
                  id:   selected.id,
                  patch: { style: { ...selected.style, textAlign: e.target.value as any } },
                })}>
                <option value="left">Left</option>
                <option value="center">Centre</option>
                <option value="right">Right</option>
              </select>

              <label>Opacity</label>
              <input
                type="range" min={0} max={1} step={0.05}
                value={selected.style.opacity ?? 1}
                onChange={e => dispatch({
                  type: 'UPDATE_ELEMENT',
                  id:   selected.id,
                  patch: { style: { ...selected.style, opacity: +e.target.value } },
                })}
              />

              <div className="se-layer-order-btns">
                <button onClick={() => dispatch({ type: 'REORDER', id: selected.id, dir: 'top' })}>Bring to Front</button>
                <button onClick={() => dispatch({ type: 'REORDER', id: selected.id, dir: 'up' })}>Forward</button>
                <button onClick={() => dispatch({ type: 'REORDER', id: selected.id, dir: 'down' })}>Backward</button>
                <button onClick={() => dispatch({ type: 'REORDER', id: selected.id, dir: 'bottom' })}>Send to Back</button>
              </div>
            </div>
          )}

          {panel === 'properties' && !selected && (
            <div className="se-properties se-empty">
              <Type size={24} className="se-empty-icon" />
              <p>Select an element to edit its properties</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SheetEditor;
