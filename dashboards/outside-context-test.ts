import { Datasource, PrometheusQuery, ColumnLayout, Dashboard, Panels, Context } from "../src"

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

let layout = new ColumnLayout()
layout.add({
    panels: [
        new Panels.Text({ content: (c) => `Service: ${c.get('service')}` }),
        http_requests
    ]
})

export default new Dashboard({
    title: "outside-context-test"
})
    .addLayout(layout)
    .setPreRender((dashboard: Dashboard, c: Context) => {
        let env = dashboard.context.get("environment")
        if (env === "preview") {
            dashboard.context.variables["service"] = "preview-service"
        }
    })
