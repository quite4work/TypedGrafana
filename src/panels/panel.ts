import { GrafanaObj, GridPosition, Context } from ".."

export abstract class Panel extends GrafanaObj {
    static nextId: number = 1

    preRender(c: Context): void {
        this.options['id'] = Panel.nextId
        Panel.nextId += 1
    }

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