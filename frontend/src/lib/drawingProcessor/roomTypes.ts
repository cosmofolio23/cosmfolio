/**
 * Room-type palette for the Color Zone tool (Floor Plans).
 * Muted, architectural colours that read well behind black linework.
 */

export interface RoomType {
  id: string
  name: string
  /** Hex fill colour (composited at ~0.55 alpha over the drawing). */
  color: string
  icon: string
}

export const ROOM_TYPES: RoomType[] = [
  { id: 'living', name: 'Living', color: '#EAD9B0', icon: '🛋️' },
  { id: 'bedroom', name: 'Bedroom', color: '#CBD7C2', icon: '🛏️' },
  { id: 'kitchen', name: 'Kitchen', color: '#E5C9B6', icon: '🍳' },
  { id: 'bathroom', name: 'Bathroom', color: '#B9D0D4', icon: '🛁' },
  { id: 'circulation', name: 'Circulation', color: '#DAD3C7', icon: '🚶' },
  { id: 'services', name: 'Services', color: '#C9C3CC', icon: '⚙️' },
  { id: 'outdoor', name: 'Outdoor', color: '#C3D7B5', icon: '🌳' },
  { id: 'void', name: 'Void', color: '#D8D8D8', icon: '⬜' },
]

export const getRoomType = (id: string): RoomType | undefined =>
  ROOM_TYPES.find(r => r.id === id)
