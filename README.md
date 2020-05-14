# TypedGrafana

**Disclaimer: early stage of development**

This library is an attempt to provide a declarative way to define Grafana dashboards that is more powerful and less obscure than the Grafana JSON model.


## Quick start

I feel like some examples will best illustrate the ideas behind TypedGrafana. If you like learning by doing, you can use the setup in the `example/` directory which will spin up a local Grafana for you (docker + docker-compose required). Please see the README in that directory for more information.

Let's start with very a minimal dashboard:

```typescript
import { Datasource, Graph, PrometheusQuery, ColumnLayout, Dashboard, Context } from "../src"

// The parameter is the datasource name in Grafana
let prometheus = new Datasource("Yay Prometheus")

let http_requests = new Graph({
    title: "HTTP requests per minute",
    datasource: prometheus,
})
    .addTarget(new PrometheusQuery({
        expr: `increase(prometheus_http_requests_total[1m])`,
        legendFormat: "{{handler}}",
    }))

let layout = new ColumnLayout()
layout.add({
    panels: [http_requests]
})

export default new Dashboard({
    title: "Prometheus monitoring Prometheus"
}).addLayout(layout)
```

This will create a very simple dashboard with just a single graph.

(TODO work in progress)


## Why?

As you can see below, there's no shortage of other projects that try to make Grafana dashboards easier to write. I tried some of these before I decided to write TypedGrafana, and overall wasn't happy with the development experience:

* For me, YAML is both difficult to read and write, so I try to avoid it
* Jsonnet isn't powerful enough for the features I want, such as dynamic column layouts where grid position needs to be calculated
* Very limited autocompletion when using `grafana-dash-gen`


## Similar projects

* [grafana-dash-gen (JavaScript)](https://github.com/uber/grafana-dash-gen)
* [grafanalib (Python)](https://github.com/weaveworks/grafanalib)
* [Grafonnet (Jsonnet)](https://github.com/grafana/grafonnet-lib)
* [Grafana dashboard builder (YAML, Python)](https://github.com/jakubplichta/grafana-dashboard-builder)
* [grafana-dashboards-generator (YAML, Python)](https://github.com/Showmax/grafana-dashboards-generator)
* [grafyaml (YAML)](https://docs.openstack.org/infra/grafyaml/)
* [salt.states.grafana4_dashboard (YAML)](https://docs.saltstack.com/en/latest/ref/states/all/salt.states.grafana4_dashboard.html)


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
