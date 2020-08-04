import { StringParameter, BooleanParameter, GrafanaObj, StringMap, GrafanaOptions, StringOptionMap, Context } from "../base_types";
import { assert } from "console";

interface CustomVariableOptions {
    name: StringParameter
    multi: BooleanParameter
}


const foldLeft = <A, B>(xs: Array<A>, zero: B) => (f: (b: B, a: A) => B): B => {
    const len = xs.length;
    if (len === 0) return zero;
    else {
        const head = xs[0];
        const tails = xs.slice(1);
        return foldLeft(tails, f(zero, head))(f);
    }
}

// Marker interface
export abstract class Variable extends GrafanaObj { }

// In Grafana, these are called "Options". Unfortunately, we've already used
// "options" as the main container in GrafanaObj, so we can't re-use it here.
// Thus I've opted to go with "choices" instead. Apologies for the confusion.
type Choice = { text: StringParameter, value: StringParameter }

export class CustomVariable extends Variable {
    options: StringOptionMap & CustomVariableOptions

    choices: Choice[]

    constructor(opts: CustomVariableOptions) {
        super()
        this.choices = []
        this.options = { ...opts }
    }

    addOption(opts: { value: StringParameter, text?: StringParameter }) {
        this.choices.push({ value: opts.value, text: opts.text || opts.value })
        return this
    }

    postRender(current: object, c: Context): StringMap<any> {
        assert(this.choices.length > 0, `When creating a custom variable you must provide at least one option (variable name: ${this.options.name})`)

        let choices = this.choices.map((choice) => {
            return { text: c.resolve(choice.text), value: c.resolve(choice.value), selected: true }
        })

        return { ...current, options: choices, current: this.generateCurrent(choices) }
    }

    generateCurrent(choices: Choice[]): { text: String, value: String[] } {
        if (this.options.multi) {
            let values = choices.map((choice) => choice.value as String)
            return { text: values.join(" + "), value: values }
        } else {
            let choice = choices[0]
            return { text: choice.text as String || choice.value as String, value: [choice.value as String] }
        }
    }
}