import { Panel, StringOptionMap } from ".."
import { StringParameter, Context } from "../base_types"

export enum TextMode {
    Markdown = "markdown",
    HTML = "html"
}
interface TextOptions {
    mode: TextMode
    content: StringParameter
    title?: StringParameter
}
export class Text extends Panel {
    options: StringOptionMap & TextOptions

    static defaults: TextOptions = {
        mode: TextMode.Markdown,
        content: ""
    }

    constructor(options: Partial<TextOptions>) {
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

    static service(opts: { name: StringParameter, logsUrl: StringParameter, repositoryUrl: StringParameter, ciUrl: StringParameter }): Panel {
        let content = (c: Context) => `
            <center>
                <h1>${c.resolve(opts.name)}</h1>
                <h2>
                    <a target="_blank" href="${c.resolve(opts.logsUrl)}">Graylog</a> –
                    <a target="_blank" href="${c.resolve(opts.repositoryUrl)}">Repository</a> –
                    <a target="_blank" href="${c.resolve(opts.ciUrl)}">Pipeline</a>
                </h2>
            </center>
        `
        return new Text({ mode: TextMode.HTML, content }).setSize(24, 3)
    }
}
