import { Panel, Context, StringOptionMap } from '.'
import { positionUtil, PConfig, ColumnState } from './positioning';

import { expect, Assertion } from 'chai';
import 'mocha';

declare global {
    export namespace Chai {
        interface Assertion {
            positionedAt(x: number, y: number): void;
        }
    }
}

Assertion.addMethod("positionedAt", function (x: number, y: number) {
    new Assertion(this._obj).to.be.instanceOf(Panel)
    let obj = <Panel>this._obj
    new Assertion([obj.getGridPosition().options.x, obj.getGridPosition().options.y]).to
        .eql([x, y], `Expected x = ${x} and y = ${y}`)
});

class TestPanel extends Panel {
    options: StringOptionMap = {}
    renderWithContext(c: Context): object {
        throw "Not implemented exception"
    }
}

describe('positionUtil', () => {

    it('should position panels', () => {
        const panel = new TestPanel()

        let config: PConfig = {
            columnWidth: 24,
            defaultHeight: 3,
            defaultWidth: 6,
            maxX: 24,
            minX: 2,
            columnState: new ColumnState
        }

        config.columnState.updateWithWidget(0, 0, 24, 2)

        const expectedResults = [
            [2, 2],
            [8, 2],
            [14, 2],
            [2, 5],
            [8, 5],
        ]

        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(expectedResults[0][0], expectedResults[0][1])

        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(expectedResults[1][0], expectedResults[1][1])

        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(expectedResults[2][0], expectedResults[2][1])

        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(expectedResults[3][0], expectedResults[3][1])

        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(expectedResults[4][0], expectedResults[4][1])
    });

    it('should position full-width panels', () => {
        let config: PConfig = {
            columnWidth: 24,
            defaultHeight: 0,
            defaultWidth: 0,
            maxX: 24,
            minX: 0,
            columnState: new ColumnState
        }

        const panel = new TestPanel().setSize(24, 6)
        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(0, 0)
        expect(config.columnState.findY(0, 1)).to.eq(6)
    });

    it('should respect the maxX option', () => {
        let config: PConfig = {
            columnWidth: 24,
            defaultHeight: 0,
            defaultWidth: 0,
            maxX: 12,
            minX: 0,
            columnState: new ColumnState
        }

        const panel = new TestPanel().setSize(12, 6)
        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(0, 0)
        expect(config.columnState.findY(0, 1)).to.eq(6)
    });

    it("should scale the panel width relative to the column width", () => {
        let config: PConfig = {
            columnWidth: 12,
            defaultHeight: 0,
            defaultWidth: 0,
            maxX: 12,
            minX: 0,
            columnState: new ColumnState
        }

        const panel = new TestPanel().setSize(12, 6)
        positionUtil(panel, config)
        expect(panel).to.be.positionedAt(0, 0)
        expect(config.columnState.findY(7, 1)).to.eq(0)
    });

    it("should be capable of determining correct y coordinate even if other widgets are already higher", () => {

        const panel1 = new TestPanel().setSize(12, 4)
        const panel2 = new TestPanel().setSize(12, 8)

        let config: PConfig = {
            columnWidth: 24,
            defaultHeight: 0,
            defaultWidth: 0,
            maxX: 24,
            minX: 0,
            columnState: new ColumnState
        }

        positionUtil(panel1, config)
        expect(panel1).to.be.positionedAt(0, 0)

        positionUtil(panel2, config)
        expect(panel2).to.be.positionedAt(12, 0)

        positionUtil(panel1, config)
        expect(panel1).to.be.positionedAt(0, 4)

        // Rows 0-7 are full now, so we should jump back to the beginning of row 8
        positionUtil(panel1, config)
        expect(panel1).to.be.positionedAt(0, 8)
    })


});

describe('ColumnState', () => {

    it("should find minimum Y coordinate", () => {
        let c = new ColumnState
        var y = c.findY(0, 12)
        expect(y).to.eq(0)

        c.updateWithWidget(0, 0, 24, 4)
        y = c.findY(0, 24)
        expect(y).to.eq(4)
    })

    it("should handle cases of varying heights", () => {
        let c = new ColumnState
        c.updateWithWidget(0, 0, 12, 4)
        c.updateWithWidget(12, 0, 12, 8)

        let yLeft = c.findY(0, 12)
        expect(yLeft).to.eq(4)

        let yRight = c.findY(12, 12)
        expect(yRight).to.eq(8)
    })

    it("should be able to tell if a widget can fit in a certain place", () => {
        let c = new ColumnState
        c.updateWithWidget(0, 0, 12, 4)
        c.updateWithWidget(12, 0, 12, 8)

        expect(c)
    })
});