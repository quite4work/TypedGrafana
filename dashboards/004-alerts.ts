import { Datasource, PrometheusQuery, ColumnLayout, Dashboard, Panels, Context, Reducer } from "../src"

// The parameter is the datasource name in Grafana
let prometheus = new Datasource("Yay Prometheus")

let http_requests = new Panels.Graph({
    title: (c) => `HTTP requests per minute ${c.get('environment')}`,
    datasource: prometheus,
})
    .addTarget(new PrometheusQuery({
        expr: `increase(prometheus_http_requests_total[1m])`,
        legendFormat: "{{handler}}",
    }))

http_requests
    .alert({ message: "Unusually low number of requests" })
    .when(Reducer.Minimum).of("A", "5m", "now").isBelow(1)


let layout = new ColumnLayout()
layout.add({
    context: new Context({
        environment: "preview",
        service: "Login service",
    }),
    panels: [
        new Panels.Text({ content: (c) => `Service: ${c.get('service')}` }),
        http_requests
    ]
})

export default new Dashboard({
    title: "004-contexts"
}).addLayout(layout)
