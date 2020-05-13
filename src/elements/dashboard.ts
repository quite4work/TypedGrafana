import { StringParameter, Renderable, Context, Layout } from ".."

export interface DashboardOptions {
    title: StringParameter
}
export class Dashboard implements Renderable {
    options: DashboardOptions

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

    renderWithContext(c: Context): object {
        let panels: object[] = []
        let cursorX = 0
        let cursorY = 0
        this.layouts.forEach((layout) => {
            let res = layout.renderWithContext(c, cursorX, cursorY)
            cursorX = res.cursorX
            cursorY = res.cursorY
            panels = panels.concat(res.panels)
        })
        return { ...this.options, panels }
    }

    render(): object {
        return this.renderWithContext(this.context)
    }

    toJSON(): any {
        return this.render()
    }
}
