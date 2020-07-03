import { NumberParameter, Context, Layout, StringParameter, StringOptionMap, GrafanaObj, StringMap } from ".."

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
    title: StringParameter,
}
export class Dashboard extends GrafanaObj {
    options: DashboardOptions & StringOptionMap
    _folderId: NumberParameter = 0

    context: Context
    layouts: Layout[]
    preRenderCallback: (dashboard: Dashboard, c: Context) => void = () => { }

    constructor(options: DashboardOptions) {
        super()
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

    setContext(context: Context): this {
        this.context = context
        return this
    }

    get folderId(): number {
        return this.context.resolve(this._folderId)
    }

    preRender(c: Context) {
        this.preRenderCallback(this, this.context)
    }

    postRender(result: StringMap<any>, c: Context): StringMap<any> {
        let panels: object[] = []
        let cursorX = 0
        let cursorY = 0
        this.layouts.forEach((layout) => {
            let res = layout.renderWithContext(c, cursorX, cursorY)
            cursorX = res.cursorX
            cursorY = res.cursorY
            panels = panels.concat(res.panels)
        })
        return { ...result, panels }
    }

    render(): object {
        return this.renderWithContext(this.context)
    }

    setPreRender(callback: (dashboard: Dashboard, c: Context) => void): this {
        this.preRenderCallback = callback
        return this
    }

    print(): void {
        console.log(JSON.stringify(this.render(), null, 2))
    }
}
