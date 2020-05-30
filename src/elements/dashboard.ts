import { NumberParameter, Renderable, Context, Layout } from ".."

// This doesn't work because setting the graphTooltip option in the]
// top-level dashboard object doesn't actually do anything. When you do
// this in the grafana UI, it updates every panel individually with a
// `tooltip` option :(
// export enum TooltipType {
//     Default = 0,
//     SharedCrosshair = 1,
//     SharedTooltip = 2,
// }

interface DashboardOptions {
    title: string,
}
export class Dashboard implements Renderable {
    options: DashboardOptions
    _folderId: NumberParameter

    context: Context
    layouts: Layout[]

    constructor(options: DashboardOptions) {
        this.context = new Context
        this.layouts = []
        this.options = { ...options }
    }

    addLayout(layout: Layout): this {
        this.layouts.push(layout)
        return this
    }

    setFolderId(folderId: NumberParameter): this {
        this._folderId = folderId
        return this
    }

    get folderId(): number {
        return this.context.resolve(this._folderId)
    }

    renderWithContext(c: Context): object {
        let panels: any[] = []
        let cursorX = 0
        let cursorY = 0
        this.layouts.forEach((layout) => {
            let res = layout.renderWithContext(c, cursorX, cursorY)
            cursorX = res.cursorX
            cursorY = res.cursorY
            panels = panels.concat(res.panels)
        })

        var i = 1
        panels.forEach(panel => {
            panel.id = i
            i++
        })

        return { ...this.options, panels }
    }

    render(): object {
        return this.renderWithContext(this.context)
    }

    print(): void {
        console.log(JSON.stringify(this.render(), null, 2))
    }
}
