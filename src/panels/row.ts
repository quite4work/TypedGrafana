import { StringOptionMap, Panel } from ".."
import { StringParameter, BooleanParameter, GridPosition } from "../base_types"

interface RowOptions {
    title: StringParameter
    collapsed?: BooleanParameter
}

export class Row extends Panel {
    options: StringOptionMap & RowOptions
    static defaults: RowOptions = {
        title: "Untitled Row",
        collapsed: false,
    }

    constructor(opts: RowOptions) {
        super()
        this.options = { ...Row.defaults, ...opts }
        this.options['type'] = 'row'
        this.options.gridPos = new GridPosition({ w: 24, h: 1 })
    }

    setGridPosition(pos: GridPosition): this {
        pos.options.w = 24
        pos.options.h = 1
        this.options.gridPos = pos
        return this
    }

    clone(): this {
        return new Row({ ...this.options }) as this
    }
}
