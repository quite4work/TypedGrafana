import { Datasource, Panel, StringOptionMap, Target } from ".."
import { StringParameter, Context } from "../base_types"
import { RawJson } from "./rawjson"

interface TableOptions {
    title?: StringParameter,
    datasource?: Datasource,
    transformations?: any[],
}
export class Table extends Panel {
    options: StringOptionMap & TableOptions

    static defaults: TableOptions = {}
    targets: Target[]

    constructor(options: Partial<TableOptions>) {
        super()
        this.targets = []
        this.options = { ...Table.defaults, ...options }
        this.options['type'] = 'table'
    }

    preRender(c: Context): void {
        super.preRender(c)
        this.options['targets'] = this.targets
    }

    addTarget(t: Target) {
        this.targets.push(t)
        return this
    }

    clone(): this {
        let table = new Table({ ...this.options })
        table.targets = this.targets
        return <this>table
    }
}