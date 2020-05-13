import { Datasource, Graph, PrometheusQuery, ColumnLayout, Dashboard, Context } from "../src"

// The parameter is the datasource name in Grafana
let prometheus = new Datasource("Yay Prometheus")

let http_requests = new Graph({
    title: "HTTP request count",
    datasource: prometheus,
})
    .addTarget(new PrometheusQuery({
        expr: `prometheus_http_requests_total`,
        legendFormat: "{{handler}}",
    }))

let layout = new ColumnLayout()
layout.addPanelsWithContext(
    0,
    new Context(),
    [http_requests]
)

export default new Dashboard({
    title: "Prometheus monitoring Prometheus"
}).addLayout(layout)
