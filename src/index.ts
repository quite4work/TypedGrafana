export * from './base_types'

export * from './elements/dashboard'
export * from './elements/datasource'
export * from './elements/layouts'

export * from './panels/panel'
export * from './panels/graph'
export * from './panels/text'

import { Graph, Text } from './panels'

export class Panels {
    static readonly Graph = Graph
    static readonly Text = Text
}