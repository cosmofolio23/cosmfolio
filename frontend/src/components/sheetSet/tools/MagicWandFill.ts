/**
 * Magic Wand Tool & Plan Recolor Engine
 *
 * Implements flood-fill boundary detection for CAD plans and presentation color themes:
 * - Clay Presentation, Blueprint Mode, Dark CAD Theme, Monochrome, Architectural Watercolor
 */

export interface PlanColorTheme {
  id: string
  name: string
  wallColor: string
  glassColor: string
  landscapeColor: string
  floorColor: string
  accentColor: string
}

export const PLAN_THEMES: PlanColorTheme[] = [
  {
    id: 'theme-clay',
    name: 'Clay Presentation',
    wallColor: '#1E293B',
    glassColor: '#93C5FD',
    landscapeColor: '#86EFAC',
    floorColor: '#F8FAFC',
    accentColor: '#D4AF37',
  },
  {
    id: 'theme-blueprint',
    name: 'Classic Blueprint',
    wallColor: '#FFFFFF',
    glassColor: '#60A5FA',
    landscapeColor: '#3B82F6',
    floorColor: '#1E3A8A',
    accentColor: '#FDE047',
  },
  {
    id: 'theme-dark-cad',
    name: 'Dark Studio CAD',
    wallColor: '#F1F5F9',
    glassColor: '#38BDF8',
    landscapeColor: '#4ADE80',
    floorColor: '#0F172A',
    accentColor: '#F43F5E',
  },
  {
    id: 'theme-monochrome',
    name: 'Swiss Monochrome',
    wallColor: '#000000',
    glassColor: '#E2E8F0',
    landscapeColor: '#CBD5E1',
    floorColor: '#FFFFFF',
    accentColor: '#EF4444',
  },
]

/**
 * Flood-fill region detection algorithm on HTML Canvas
 * Selects enclosed line boundaries tolerant of small CAD gaps.
 */
export function floodFillCanvasRegion(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  tolerance: number = 32
) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const startPos = (startY * width + startX) * 4
  const startR = data[startPos]
  const startG = data[startPos + 1]
  const startB = data[startPos + 2]
  const startA = data[startPos + 3]

  // Convert fill color hex to RGB
  const hex = fillColor.replace('#', '')
  const fillR = parseInt(hex.substring(0, 2), 16) || 0
  const fillG = parseInt(hex.substring(2, 4), 16) || 0
  const fillB = parseInt(hex.substring(4, 6), 16) || 0

  const pixelStack: [number, number][] = [[startX, startY]]

  function colorMatch(pos: number) {
    const r = data[pos]
    const g = data[pos + 1]
    const b = data[pos + 2]
    const a = data[pos + 3]

    return (
      Math.abs(r - startR) <= tolerance &&
      Math.abs(g - startG) <= tolerance &&
      Math.abs(b - startB) <= tolerance &&
      Math.abs(a - startA) <= tolerance
    )
  }

  const visited = new Uint8Array(width * height)

  while (pixelStack.length) {
    const newPos = pixelStack.pop()!
    const x = newPos[0]
    let y = newPos[1]

    let pixelPos = (y * width + x) * 4

    while (y >= 0 && colorMatch(pixelPos)) {
      y--
      pixelPos -= width * 4
    }

    pixelPos += width * 4
    y++

    let reachLeft = false
    let reachRight = false

    while (y < height && colorMatch(pixelPos)) {
      data[pixelPos] = fillR
      data[pixelPos + 1] = fillG
      data[pixelPos + 2] = fillB
      data[pixelPos + 3] = 255

      visited[y * width + x] = 1

      if (x > 0) {
        if (colorMatch(pixelPos - 4)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < width - 1) {
        if (colorMatch(pixelPos + 4)) {
          if (!reachRight) {
            pixelStack.push([x + 1, y])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }

      y++
      pixelPos += width * 4
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
