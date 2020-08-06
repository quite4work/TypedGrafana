import { StringParameter, BooleanParameter, GrafanaObj, StringMap, GrafanaOptions, StringOptionMap, Context } from "../base_types";
import { assert } from "console";

interface CustomVariableOptions {
    name: StringParameter
    multi?: BooleanParameter
    includeAll?: BooleanParameter
    allValue?: StringParameter
}

// Marker interface
export abstract class Variable extends GrafanaObj { }

// In Grafana, these are called "Options". Unfortunately, we've already used
// "options" as the main container in GrafanaObj, so we can't re-use it here.
// Thus I've opted to go with "choices" instead. Apologies for the confusion.
type Choice = { text: StringParameter, value: StringParameter }

export class CustomVariable extends Variable {
    options: StringOptionMap & CustomVariableOptions
    static defaults: CustomVariableOptions = {
        name: "",
        multi: false,
        includeAll: false,
        allValue: null,
    }

    choices: Choice[]

    constructor(opts: CustomVariableOptions) {
        super()
        this.choices = []
        this.options = { ...CustomVariable.defaults, ...opts }
        this.options['type'] = 'custom'
        this.options['query'] = 'ams1,ams2'
    }

    addOption(opts: { value: StringParameter, text?: StringParameter }) {
        this.choices.push({ value: opts.value, text: opts.text || opts.value })
        return this
    }

    postRender(current: object, c: Context): StringMap<any> {
        if (this.options.includeAll) {
            this.choices.unshift({ text: "All", value: "$__all" })
        }

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