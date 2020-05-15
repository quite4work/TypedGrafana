import { Panel, StringOptionMap } from ".."
import { StringParameter } from "../base_types"

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

    static service(opts: { name: string, logsUrl: string, repositoryUrl: string, ciUrl: string }): Panel {
        let content = `
            <center>
                <h1>${opts.name}</h1>
                <h2>
                    <a target="_blank" href="${opts.logsUrl}">Graylog</a> –
                    <a target="_blank" href="${opts.repositoryUrl}">Repository</a> –
                    <a target="_blank" href="${opts.ciUrl}">Pipeline</a>
                </h2>
            </center>
        `
        return new Text({ mode: TextMode.HTML, content }).setSize(24, 3)
    }
}
