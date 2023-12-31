import { Context, Panel, StringMap } from ".."
import { positionUtil, PConfig, ColumnState } from "../positioning"
import { isArray } from "util"

// Very similar to Renderable, except that it also takes and returns it's
// current "cursor position", i.e. the position where the last
// element from this layout _ends_
export interface Layout {
    renderWithContext(c: Context, cursorX: number, cursorY: number): {
        panels: object, cursorX: number, cursorY: number
    }
}

interface ColumnLayoutOptions {
    defaultPanelWidth: number,
    defaultPanelHeight: number,
    columns: {
        width: number,
        context?: Context
    }[]
}
export class ColumnLayout implements Layout {
    static defaults: ColumnLayoutOptions = {
        defaultPanelWidth: 24,
        defaultPanelHeight: 5,
        columns: [
            { width: 12 },
            { width: 12 },
        ]
    }

    options: ColumnLayoutOptions

    panels: {
        panel: Panel,
        column: number,
        context: Context,
    }[] = []

    constructor(options: Partial<ColumnLayoutOptions> = {}) {
        this.options = { ...ColumnLayout.defaults, ...options }
    }

    add(opts: { column?: number, context?: Context, panels: (Panel | Panel[])[] }) {
        let column = opts.column ?? 0
        let context = opts.context ?? new Context

        opts.panels.forEach((panel) => {
            if (isArray(panel)) {
                panel.forEach((panel) => {
                    this.panels.push({ panel: panel.clone(), context, column })
                })
            } else {
                this.panels.push({ panel: panel.clone(), context, column })
            }
        })
    }

    renderWithContext(c: Context, cursorX: number, cursorY: number): { panels: object, cursorX: number, cursorY: number } {
        let columnXOffset = 0
        //let allYs: number[] = [cursorY]
        let columnState = new ColumnState

        for (let columnIdx in this.options.columns) {
            let panels = this.panels.filter((p) => p.column === parseInt(columnIdx))

            let column = this.options.columns[columnIdx]

            let currentX = columnXOffset
            //let currentY = cursorY

            let config: PConfig = {
                columnState,
                columnWidth: column.width,
                defaultHeight: this.options.defaultPanelHeight,
                defaultWidth: this.options.defaultPanelWidth,
                minX: columnXOffset,
                maxX: columnXOffset + column.width
            }


            panels.forEach((p) => {
                positionUtil(
                    p.panel,
                    config
                )

                // currentX = res.currentX
                // currentY = res.currentY
                // allYs.push(currentY + res.height)
            })

            columnXOffset += column.width
        }

        let panels: StringMap<any>[] = []
        this.panels.forEach((p) => {
            panels.push(p.panel.renderWithContext(c.merge(p.context)))
        })


        return {
            panels,
            cursorX: 0,
            cursorY: Math.max(...columnState.state),
        }
    }
}
