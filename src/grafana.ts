import { isArray, isObject } from "util"
import { inspect } from 'util'

export class Context {
    variables: { [idx: string]: string } = {}

    constructor(variables: { [idx: string]: string } = {}) {
        this.variables = variables
    }

    get(idx: string) {
        let value = this.variables[idx]
        if (typeof value === 'undefined') {
            throw `Context variable '${idx}' was not available`
        }
        return value
    }

    merge(other?: Context): Context {
        return new Context({ ...this.variables, ...other?.variables })
    }

    resolve<T>(x: Parameter<T>): T {
        if (x instanceof Function) {
            return x(this)
        }
        return x
    }
}

function isRenderable(object: any): object is Renderable {
    return 'renderWithContext' in object
}

type StringMap<T> = { [key: string]: T }
export type StringOptionMap = StringMap<GrafanaOptions>

type ContextSensitiveParameter<T> = (c: Context) => T
type Parameter<T> = T | ContextSensitiveParameter<T>
type StringParameter = Parameter<string>
type BooleanParameter = Parameter<boolean>
type NumberParameter = Parameter<number>

type PrimitiveOption = StringParameter | BooleanParameter | NumberParameter
type GrafanaOption =
    Renderable
    | PrimitiveOption

type GrafanaOptions =
    GrafanaOption |
    GrafanaOption[] |
    undefined

export abstract class GrafanaObj implements Renderable {
    abstract options: StringOptionMap

    preRender(c: Context): void { }
    // postRender(c: Context, result: StringMap<any>): StringMap<any> {
    //     return result
    // }

    renderWithContext(c: Context): StringMap<any> {
        this.preRender(c)

        let result: StringMap<any> = {}
        for (let key in this.options) {
            result[key] = this.renderOption(c, this.options[key])
        }

        // this.postRender(c, result)
        return result
    }

    renderOption(c: Context, option: GrafanaOptions): any {
        if (isArray(option)) {
            return option.map((x) => this.renderOption(c, x))
        }

        if (isObject(option) && isRenderable(option)) {
            return option.renderWithContext(c)
        }

        if (option instanceof Function) {
            return c.resolve<any>(option)
        }

        return option
    }

    clone(): this {
        throw "Clone not supported"
    }
}

interface Renderable {
    renderWithContext(c: Context): object
}

export interface DashboardOptions {
    title: StringParameter
}
export class Dashboard implements Renderable {
    options: DashboardOptions
    static defaults: DashboardOptions = {
        title: "Untitled dashboard"
    }

    context: Context
    layouts: Layout[]

    constructor(options: Partial<DashboardOptions> = {}) {
        this.context = new Context
        this.layouts = []
        this.options = { ...Dashboard.defaults, ...options }
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

interface GridPositionOptions {
    x?: number
    y?: number
    w?: number
    h?: number
}
export class GridPosition implements Renderable {
    options: GridPositionOptions;

    constructor(options: GridPositionOptions = {}) {
        this.options = options;
    }
    renderWithContext(c: Context): object {
        return { ...this.options }
    }
}



export abstract class Panel extends GrafanaObj {
    setGridPosition(pos: GridPosition): this {
        this.options.gridPos = pos
        return this
    }

    getGridPosition(): GridPosition {
        return (<GridPosition>this.options.gridPos) ?? new GridPosition()
    }

    setSize(width?: number, height?: number): this {
        this.options.gridPos = new GridPosition({ w: width, h: height })
        return this
    }
}


export interface YAxisOptions {
    format: string,
    logBase: number,
    show: boolean,
    label?: string,
    max?: number,
    min?: number,
}
export class YAxis implements Renderable {
    options: StringOptionMap & YAxisOptions
    static defaults: YAxisOptions = {
        format: 'short',
        logBase: 1,
        show: true,
    }

    constructor(options: Partial<YAxisOptions>) {
        this.options = { ...YAxis.defaults, ...options }
    }

    renderWithContext(c: Context): object {
        return this.options
    }
}


export interface GraphOptions {
    title: string
    stack: boolean,
    yaxes?: YAxis[],
    datasource?: Datasource
}
export class Graph extends Panel {
    options: StringOptionMap & GraphOptions
    static defaults: GraphOptions = {
        title: "Untitled Graph",
        stack: false,
    }

    targets: Target[]

    constructor(options: Partial<GraphOptions> = {}) {
        super()
        this.targets = []
        this.options = { ...Graph.defaults, ...options }

        // Grafana is picky about how many Y-axes you have in your graphs. Either you don't
        // specify the option at all (undefined, not an empty array), or you have two. Everything
        // else will lead to errors in the dashboard.
        if (this.options.yaxes) {
            assert(this.options.yaxes?.length > 0, "You specified an empty array of Y-axes. This will confuse Grafana. Please specify either one or two Y-axes.")
            if (this.options.yaxes?.length == 1) {
                this.options.yaxes?.push(new YAxis({}))
            }
        }

    }

    preRender(c: Context): void {
        this.options['type'] = "graph"
        this.options['targets'] = this.targets
    }

    addTarget(t: Target) {
        this.targets.push(t)
        return this
    }

    clone(): this {
        let x = new Graph
        x.options = { ...this.options }
        x.targets = this.targets
        return <this>x
    }
}




export interface DatasourceOptions {
    name: StringParameter
}

export class Datasource implements Renderable {
    name: StringParameter
    constructor(name: StringParameter) {
        this.name = name
    }
    renderWithContext(c: Context): any {
        return c.resolve(this.name)
    }
}









abstract class Target extends GrafanaObj { }

interface PrometheusOptions {
    expr: StringParameter
    legendFormat?: StringParameter
    datasource?: Datasource

}
export class PrometheusQuery extends GrafanaObj implements Target {
    options: StringOptionMap & PrometheusOptions
    constructor(options: PrometheusOptions) {
        super()
        this.options = { ...options }
    }
}




export enum TextMode {
    Markdown = "markdown",
    HTML = "html"
}
interface TextOptions {
    mode: TextMode,
    content: string,
    title?: string,
}
export class Text extends Panel {
    options: StringOptionMap & TextOptions

    static defaults: TextOptions = {
        mode: TextMode.Markdown,
        content: ""
    }

    constructor(options: TextOptions) {
        super()
        this.options = { ...Text.defaults, ...options }
        this.options['type'] = 'text'
    }

    clone(): this {
        return <this>new Text({ ...this.options })
    }
}

export class Headers {
    static dashboard(title: string, slackChannel: string): Panel {
        let content = `<center><h1>${title}</h1> <h3>Slack: ${slackChannel}</h3></center>`
        return new Text({ mode: TextMode.HTML, content }).setSize(24, 3)
    }

    static service(name: string, graylogUrl: string, repositoryUrl: string): Panel {
        let content = `
            <center>
                <h1>${name}</h1>
                <h2>
                    <a target="_blank" href="${graylogUrl}">Graylog</a> –
                    <a target="_blank" href="${repositoryUrl}">Repository</a>
                </h2>
            </center>
        `
        return new Text({ mode: TextMode.HTML, content }).setSize(24, 3)
    }
}

// Very similar to Renderable, except that it also takes and returns it's
// current "cursor position", i.e. the position where the last
// element from this layout _ends_
interface Layout {
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
        defaultPanelHeight: 4,
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

    addPanelsWithContext(column: number, context: Context, panels: Panel[]) {
        panels.forEach((panel) => {
            this.panels.push({ panel: panel.clone(), context, column })
        })
    }

    renderWithContext(c: Context, cursorX: number, cursorY: number): { panels: object, cursorX: number, cursorY: number } {
        let columnXOffset = 0
        let allYs: number[] = [cursorY]

        for (let columnIdx in this.options.columns) {
            let panels = this.panels.filter((p) => p.column === parseInt(columnIdx))

            let column = this.options.columns[columnIdx]

            let currentX = columnXOffset
            let currentY = cursorY


            panels.forEach((p) => {
                let res = positionUtil(
                    p.panel,
                    columnXOffset,
                    columnXOffset + column.width,
                    this.options.defaultPanelWidth,
                    this.options.defaultPanelHeight,
                    currentX,
                    currentY,
                    column.width
                )

                currentX = res.currentX
                currentY = res.currentY
                allYs.push(currentY + res.height)
            })

            columnXOffset += column.width
        }

        let panels: StringMap<any>[] = []
        this.panels.forEach((p) => {
            // TODO this should merge with the given context
            panels.push(p.panel.renderWithContext(p.context))
        })


        return {
            panels,
            cursorX: 0,
            cursorY: Math.max(...allYs),
        }
    }
}

import { strict as assert } from 'assert';

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

    // console.log(minX)
    // console.log(newPos)
    // console.log("---")

    return { currentX, currentY, height: h }
}