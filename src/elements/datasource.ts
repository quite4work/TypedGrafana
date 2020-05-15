import { StringParameter, Renderable, Context } from ".."

export class Datasource implements Renderable {
    static readonly Mixed = new Datasource("-- Mixed --")

    name: StringParameter
    constructor(name: StringParameter) {
        this.name = name
    }
    renderWithContext(c: Context): any {
        return c.resolve(this.name)
    }
}
