import { strict as assert } from 'assert';
import { Renderable, StringOptionMap, Context, Datasource, Panel, StringParameter, GrafanaObj } from ".."
import { NumberParameter, BooleanParameter } from '..';

interface YAxisOptions {
    format: StringParameter,
    logBase: NumberParameter,
    show: BooleanParameter,
    label?: StringParameter,
    max?: NumberParameter,
    min?: NumberParameter,
}
export class YAxis extends GrafanaObj {
    options: StringOptionMap & YAxisOptions
    static defaults: YAxisOptions = {
        format: 'short',
        logBase: 1,
        show: true,
    }

    constructor(options: Partial<YAxisOptions>) {
        super()
        this.options = { ...YAxis.defaults, ...options }
    }
}

interface SeriesOverrideOptions {
    alias: StringParameter
    color?: StringParameter
    fill?: NumberParameter
    lines?: BooleanParameter
    dashes?: BooleanParameter
    hideTooltip?: BooleanParameter
    nullPointMode?: StringParameter
    yaxis?: NumberParameter
    linewidth?: NumberParameter
    dashLength?: NumberParameter
    spaceLength?: NumberParameter
    stack?: BooleanParameter
    transform?: StringParameter
}
export class SeriesOverride extends GrafanaObj {
    options: StringOptionMap & SeriesOverrideOptions
    constructor(options: SeriesOverrideOptions) {
        super()
        this.options = { ...options }
    }
}

abstract class Target extends GrafanaObj { }

interface PrometheusOptions {
    expr: StringParameter
    legendFormat?: StringParameter
    datasource?: Datasource,
    interval?: StringParameter,
    intervalFactor?: NumberParameter,
}
export class PrometheusQuery extends Target {
    options: StringOptionMap & PrometheusOptions

    static defaults: PrometheusOptions = {
        expr: null,
    }

    constructor(options: PrometheusOptions) {
        super()
        this.options = { ...PrometheusQuery.defaults, ...options }
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

export enum NullPointMode {
    NullAsZero = "null as zero",
    Null = "null",
    Connected = "connected",
}

export enum TooltipSortMode {
    None = 0,
    Increasing = 1,
    Decreasing = 2,
}

class TooltipOptions implements Renderable {
    shared?: BooleanParameter
    sort?: TooltipSortMode

    renderWithContext(c: Context): object {
        return { shared: c.resolve(this.shared), sort: this.sort, value_type: 'individual' }
    }
}

interface GraphOptions {
    title: StringParameter
    stack: BooleanParameter
    datasource: Datasource
    yaxes?: YAxis[]
    seriesOverrides?: SeriesOverride[]
    interval?: StringParameter
    bars?: BooleanParameter
    lines?: BooleanParameter
    linewidth?: NumberParameter,
    fill?: NumberParameter,
    fillGradient?: NumberParameter,
    nullPointMode?: NullPointMode,
    tooltip?: TooltipOptions
}
export class Graph extends Panel {
    options: StringOptionMap & GraphOptions
    static defaults: GraphOptions = {
        title: "Untitled Graph",
        stack: false,
        datasource: Datasource.Mixed,
        tooltip: new TooltipOptions
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
        super.preRender(c)
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
