import { positionUtil, Panel, Context, StringOptionMap } from './grafana';

import { expect, Assertion } from 'chai';
import 'mocha';

declare global {
    export namespace Chai {
        interface Assertion {
            positionedAt(x: number, y: number): void;
        }
    }
}

Assertion.addMethod("positionedAt", function(x: number, y: number) {
    new Assertion(this._obj).to.be.instanceOf(Panel)
    let obj = <Panel>this._obj
    new Assertion(obj.getGridPosition().options.x).to
        .eq(x, `Expected x = ${x}`)
    new Assertion(obj.getGridPosition().options.y).to
        .eq(y, `Expected y = ${y}`)
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

    const width = 6
    const height = 3
    const minX = 2

    let cursorX = minX
    let cursorY = 2

    const expectedResults = [
        [2,2],
        [8, 2],
        [14, 2],
        [2, 5],
        [8, 5],
    ]

    for (const expected of expectedResults) {
        let result = positionUtil(panel, minX, 24, width, height, cursorX, cursorY)
        expect(panel).to.be.positionedAt(expected[0], expected[1])
        cursorX = result.currentX
        cursorY = result.currentY
    }
  });

  it('should position full-width panels', () => {
    const panel = new TestPanel().setSize(24, 6)
    let result = positionUtil(panel, 0, 24, 0, 0, 0, 0)
    expect(panel).to.be.positionedAt(0, 0)
    expect(result.currentX).to.eq(0)
    expect(result.currentY).to.eq(6)
  });

  it('should respect the maxX option', () => {
    const panel = new TestPanel().setSize(12, 6)
    let result = positionUtil(panel, 0, 12, 0, 0, 0, 0)
    expect(panel).to.be.positionedAt(0, 0)
    expect(result.currentX).to.eq(0)
    expect(result.currentY).to.eq(6)
  });
});