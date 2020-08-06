import { Panel } from "..";
import { StringMap, GrafanaOptions, Context, StringOptionMap } from "../base_types";

interface RawJsonOptions {
    json: string
}

export class RawJson extends Panel {
    options: StringOptionMap & RawJsonOptions

    constructor(opts: RawJsonOptions) {
        super()
        this.options = { ...opts }
    }

    postRender(current: object, c: Context): StringMap<any> {
        return JSON.parse(this.options.json)
    }

    clone(): this {
        return new RawJson({ json: this.options.json }) as this
    }
}