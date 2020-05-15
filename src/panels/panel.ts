import { GrafanaObj, GridPosition } from ".."

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