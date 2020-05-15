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
