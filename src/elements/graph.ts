import { strict as assert } from 'assert';
import { Renderable, StringOptionMap, Context, Datasource, Panel, StringParameter, GrafanaObj } from ".."

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
    datasource: Datasource,
    yaxes?: YAxis[],
    seriesOverrides?: SeriesOverride[],
}
export class Graph extends Panel {
    options: StringOptionMap & GraphOptions
    static defaults: GraphOptions = {
        title: "Untitled Graph",
        stack: false,
        datasource: Datasource.Mixed,
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







abstract class Target extends GrafanaObj { }

interface PrometheusOptions {
    expr: StringParameter
    legendFormat?: StringParameter
    datasource?: Datasource
}
export class PrometheusQuery extends Target {
    options: StringOptionMap & PrometheusOptions
    constructor(options: PrometheusOptions) {
        super()
        this.options = { ...options }
    }
}

interface InfluxDbOptions {
    alias: StringParameter
    datasource: Datasource
    query: StringParameter
}
export class InfluxDbQuery extends Target {
    options: StringOptionMap & InfluxDbOptions
    constructor(options: InfluxDbOptions) {
        super()
        this.options = { ...options }
        this.options['rawQuery'] = true
    }
}

export class SeriesOverride extends GrafanaObj {
    options: StringOptionMap
    constructor(options: StringOptionMap) {
        super()
        this.options = { ...options }
    }
}
