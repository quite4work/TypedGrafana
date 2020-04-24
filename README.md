# Grafscript

**Disclaimer: early stage of development and likely not ready for your use-case yet :)**

This project is an attempt to provide a declarative way to define Grafana dashboards that is less obscure than the Grafana JSON model. Here's an example:

```typescript
let thanos = new Datasource("Thanos Datasource")

let incoming = new Graph({
    title: "Incoming messages / s",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(cluster) ( increase(misc:application:${c.get('serviceId')}_incoming_messages[1m]))`,
        legendFormat: "{{cluster}}"
    }))

let outgoing = new Graph({
    title: "Outgoing messages / s",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(cluster) ( increase(misc:application:${c.get('serviceId')}_outgoing_messages[1m]))`,
        legendFormat: "{{cluster}}"
    }))

let layout = new ColumnLayout({
    columns: [
        { width: 12 },
        { width: 12 }
    ]
})

servicesLayout.addPanelsWithContext(
    0,
    new Context({
        serviceId: "some_service",
    }),
    [ incoming, outgoing ]
)

servicesLayout.addPanelsWithContext(
    1,
    new Context({
        serviceId: "some_other_service",
    }),
    [ incoming, outgoing ]
)

let dashboard = new Dashboard({
    title: "Hackweek dashboard"
}).addLayout(servicesLayout)

// See update.sh for how this can be applied
writeFileSync(
    './grafana-api-dashboard-update-payload.json',
    JSON.stringify({dashboard, overwrite: true}))
```


## Similar projects

* [Grafonnet](https://github.com/grafana/grafonnet-lib)
* [Grafana dashboard builder](https://github.com/jakubplichta/grafana-dashboard-builder)


## License

Copyright (C) 2020 Lucas Jenss

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.