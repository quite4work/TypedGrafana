import { Datasource, Panels, PrometheusQuery, ColumnLayout, Dashboard } from "../src"

// The parameter is the datasource name in Grafana
let prometheus = new Datasource("Yay Prometheus")

let http_requests = new Panels.Graph({
    title: "HTTP requests per minute",
    datasource: prometheus,
})
    .addTarget(new PrometheusQuery({
        expr: `increase(prometheus_http_requests_total[1m])`,
        legendFormat: "{{handler}}",
    }))

let layout = new ColumnLayout({
    columns: [
        { width: 12 },
        { width: 12 },
    ]
})

layout.add({
    column: 0,
    panels: [
        new Panels.Text({ content: "# left column" }),
        http_requests
    ]
})

layout.add({
    column: 1,
    panels: [
        new Panels.Text({ content: "# right column" }),
        http_requests
    ]
})

export default new Dashboard({
    title: "002-columns"
}).addLayout(layout)
