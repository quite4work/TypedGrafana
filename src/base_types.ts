import { isArray, isObject } from "util"

type ContextSensitiveParameter<T> = (c: Context) => T
type Parameter<T> = T | ContextSensitiveParameter<T>
export type StringParameter = Parameter<string>
export type BooleanParameter = Parameter<boolean>
export type NumberParameter = Parameter<number>

type PrimitiveOption = StringParameter | BooleanParameter | NumberParameter
type GrafanaOption =
    Renderable
    | PrimitiveOption

export type GrafanaOptions =
    GrafanaOption |
    GrafanaOption[] |
    undefined

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

export function isRenderable(object: any): object is Renderable {
    return 'renderWithContext' in object
}

export interface Renderable {
    renderWithContext(c: Context): object
}

export type StringMap<T> = { [key: string]: T }
export type StringOptionMap = StringMap<GrafanaOptions>

export abstract class GrafanaObj implements Renderable {
    abstract options: StringOptionMap

    preRender(c: Context): void { }

    renderWithContext(c: Context): StringMap<any> {
        this.preRender(c)

        let result: StringMap<any> = {}
        for (let key in this.options) {
            result[key] = this.renderOption(c, this.options[key])
        }

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