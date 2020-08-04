import { Datasource, PrometheusQuery, ColumnLayout, Dashboard, Panels, CustomVariable, TextMode } from "../src"

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

let foo = new Panels.Text({
    title: "variable content",
    mode: TextMode.Markdown,
    content: "Datacenter: ${datacenter:pipe} Flubbel: ${flubbel}"
})

let layout = new ColumnLayout()
layout.add({
    panels: [http_requests, foo]
})

export default new Dashboard({
    title: "004-templating"
})
    .addLayout(layout)
    .addVariable(
        new CustomVariable({
            name: "datacenter",
            multi: true,
        })
            .addOption({ value: "dc-ams1" })
            .addOption({ value: "ams2" })
    )
    .addVariable(
        new CustomVariable({
            name: "flubbel",
            multi: false,
        })
            .addOption({ value: "foo", text: "Foo" })
            .addOption({ value: "bar", text: "Bar" })
    )
