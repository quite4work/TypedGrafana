import { NumberParameter, Context, Layout, StringParameter, StringOptionMap, GrafanaObj, StringMap, Variable, Graph, TooltipSortMode } from ".."

export enum TooltipType {
    Default = 0,
    SharedCrosshair = 1,
    SharedTooltip = 2,
}

interface DashboardOptions {
    title: StringParameter,
    graphTooltip?: TooltipType,

    // Legacy, pre schema version 14, https://community.grafana.com/t/graphtooltip-does-not-get-applied-when-set-in-scripted-dashboard/4668
    sharedCrosshair?: TooltipType,
}
export class Dashboard extends GrafanaObj {
    options: DashboardOptions & StringOptionMap
    _folderId: NumberParameter = 0

    context: Context
    layouts: Layout[]
    variables: Variable[]
    preRenderCallback: (dashboard: Dashboard, c: Context) => void = () => { }

    constructor(options: DashboardOptions) {
        super()
        this.context = new Context
        this.layouts = []
        this.variables = []
        this.options = { ...options }
    }

    addLayout(layout: Layout): this {
        this.layouts.push(layout)
        return this
    }

    addVariable(variable: Variable) {
        this.variables.push(variable)
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

        let templating = {
            list: this.variables.map((v) => {
                return v.renderWithContext(c)
            })
        }

        return { ...result, panels, templating }
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

    setSharedCrosshair(): this {
        Graph.defaults.tooltip.shared = true
        Graph.defaults.tooltip.sort = TooltipSortMode.Decreasing
        this.options.graphTooltip = TooltipType.SharedCrosshair
        this.options.sharedCrosshair = TooltipType.SharedCrosshair
        return this
    }
}
