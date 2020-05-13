import { strict as assert } from 'assert';
import { Panel, GridPosition } from "."

export function positionUtil(
    panel: Panel,
    minX: number,
    maxX: number,
    defaultWidth: number,
    defaultHeight: number,
    currentX: number,
    currentY: number,
    columnWidth: number,
): { currentX: number, currentY: number, height: number } {
    assert(currentX >= minX, "The initial X cursor most not be smaller than the mininum X cursor")

    let gridPos = panel.getGridPosition()

    let x = currentX
    let y = currentY
    let w = gridPos.options.w ?? defaultWidth
    let h = gridPos.options.h ?? defaultHeight

    // Scale panel width relative to column width. E.g. in a width = 12 column, a panel of width "24"
    // is scaled to width 12. This allows panels to be configured independently of the columns they are
    // placed in.
    w *= (columnWidth / 24)

    if (x + w > maxX) {
        x = minX
        y += h
    }

    let newPos = new GridPosition({ x, y, w, h })
    panel.setGridPosition(newPos)

    currentX = x + w
    currentY = y

    if (currentX >= maxX) {
        currentX = minX
        currentY += h
    }

    return { currentX, currentY, height: h }
}
