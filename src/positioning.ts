import { strict as assert } from 'assert';
import { Panel, GridPosition } from "."

export class ColumnState {
    state: number[]
    constructor() {
        this.state = Array(24)
        this.state.fill(0)
    }

    findY(cursorX: number, width: number): number {
        var max = 0
        for (let i = cursorX; (i < cursorX + width) && (i < 24); i++) {
            if (this.state[i] > max) {
                max = this.state[i]
            }
        }
        return max
    }

    updateWithWidget(x: number, y: number, w: number, h: number): void {
        let yBelowWidget = y + h
        for (let i = x; (i < x + w) && (i < 24); i++) {
            this.state[i] = yBelowWidget
        }
    }

    anyOccuppied(x: number, y: number, w: number): boolean {
        return false
    }
}

export interface PConfig {
    minX: number,
    maxX: number,
    defaultWidth: number,
    defaultHeight: number,
    columnWidth: number,
    columnState: ColumnState,
}

export function positionUtil(
    panel: Panel,
    c: PConfig,
) {
    assert(c.minX >= 0)
    assert(c.maxX > 0)
    assert(c.minX < c.maxX)

    let gridPos = panel.getGridPosition()

    let w = gridPos.options.w ?? c.defaultWidth
    let h = gridPos.options.h ?? c.defaultHeight

    // Scale panel width relative to column width. E.g. in a width = 12 column, a panel of width "24"
    // is scaled to width 12. This allows panels to be configured independently of the columns they are
    // placed in.
    w *= (c.columnWidth / 24)

    var yMin = c.columnState.findY(c.minX, w)
    for (let i = c.minX; i <= (c.maxX - w); i++) {
        var yy = c.columnState.findY(i, w)
        if (yy < yMin) {
            yMin = yy
        }
    }

    // find left most x that fits
    var x = c.minX
    for (let i = c.minX; i <= (c.maxX - w); i++) {
        var y = c.columnState.findY(i, w)
        if (y == yMin) {
            x = i
            break
        }
    }

    let newPos = new GridPosition({ x, y, w, h })
    panel.setGridPosition(newPos)
    c.columnState.updateWithWidget(x, y, w, h)
}
