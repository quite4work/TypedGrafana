import { strict as assert } from 'assert';
import { StringOptionMap, Context, Datasource, Panel, StringParameter, GrafanaObj, Renderable } from ".."
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

export enum Reducer {
    Minimum = "min",
    Maximum = "max",
    Sum = "sum",
    Count = "count",
    Last = "last",
    Median = "median",
    Difference = "diff",
    PercentDifference = "percent_diff",
    CountNonNull = "count_non_null",
}

interface ConditionOptions {
    evaluator: { params: any[], type: string }
    operator: { type: string }
    query: { params: string[] }
    reducer: { type: Reducer }
    type: string
}

class Condition implements Renderable {
    options: ConditionOptions

    constructor(options: ConditionOptions) {
        this.options = options
    }

    renderWithContext(c: Context): object {
        return this.options
    }
}

class ConditionBuilderSourceStage {
    parent: Alert
    condition: Partial<ConditionOptions>

    constructor(parent: Alert, reducer: Reducer, operator: string) {
        this.parent = parent
        this.condition = {
            reducer: { type: reducer },
            operator: { type: operator },
            type: "query"
        }
    }

    of(queryId: string, timeWindow: string, ending: string): ConditionBuilderEvaluatorStage {
        this.condition.query = { params: [queryId, timeWindow, ending] }
        return new ConditionBuilderEvaluatorStage(this.parent, this.condition)
    }
}

class ConditionBuilderEvaluatorStage {
    parent: Alert
    condition: Partial<ConditionOptions>

    constructor(parent: Alert, condition: Partial<ConditionOptions>) {
        this.parent = parent
        this.condition = condition
    }

    isBelow(limit: number) {
        this.condition.evaluator = { type: "lt", params: [limit] }
        return this.parent.addCondition(new Condition(this.condition as ConditionOptions))
    }
}

interface AlertOptions {
    name: StringParameter
    message?: StringParameter
    notifications?: [StringParameter],
    for: StringParameter,
    frequency: StringParameter,
    executionErrorState: StringParameter,
    noDataState: StringParameter,
}
class Alert extends GrafanaObj {
    options: StringOptionMap & AlertOptions
    static defaults: AlertOptions = {
        name: "Unnamed alert",
        for: "5m",
        frequency: "5m",
        executionErrorState: "alerting",
        noDataState: "no_data",
    }

    conditions: Condition[] = []

    constructor(options: Partial<AlertOptions> = {}) {
        super()
        this.options = { ...Alert.defaults, ...options }
    }

    preRender(c: Context): void {
        this.options['conditions'] = this.conditions
    }

    addCondition(condition: Condition): this {
        this.conditions.push(condition)
        return this
    }

    when(reducer: Reducer): ConditionBuilderSourceStage {
        return this.and(reducer)
    }

    and(reducer: Reducer): ConditionBuilderSourceStage {
        return new ConditionBuilderSourceStage(this, reducer, "and")
    }

    or(reducer: Reducer): ConditionBuilderSourceStage {
        return new ConditionBuilderSourceStage(this, reducer, "or")
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
}
export class Graph extends Panel {
    options: StringOptionMap & GraphOptions
    static defaults: GraphOptions = {
        title: "Untitled Graph",
        stack: false,
        datasource: Datasource.Mixed,
    }

    targets: Target[]
    _alert?: Alert

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

    idOf(i) {
        return (i >= 26 ? this.idOf((i / 26 >> 0) - 1) : '') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26 >> 0];
    }

    preRender(c: Context): void {
        this.options['type'] = "graph"

        var i = 0
        this.targets.forEach(target => {
            target.options.refId = this.idOf(i)
            i++
        })

        this.options['targets'] = this.targets
        this.options['alert'] = this._alert


    }

    addTarget(t: Target) {
        this.targets.push(t)
        return this
    }

    alert(options: Partial<AlertOptions>) {
        this._alert = new Alert(options)
        console.log("wat")
        return this._alert
    }

    clone(): this {
        let x = new Graph
        x.options = { ...this.options }
        x.targets = this.targets
        x._alert = this._alert
        return <this>x
    }
}
