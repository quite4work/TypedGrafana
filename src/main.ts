import {
    Dashboard,
    Graph,
    Datasource,
    PrometheusQuery,
    Context,
    ColumnLayout,
    FullWidthLayout,
    Headers
} from "./grafana";

// To write to a JSON file :)
import { writeFileSync } from 'fs'

let thanos = new Datasource("Thanos")



let incoming = new Graph({
    title: "Incoming messages / s",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(cluster) ( increase(misc:application:${c.get('id')}_incoming_messages[1m]))`,
        legendFormat: "{{cluster}}"
    }))
    
let outgoing = new Graph({
    title: "Outgoing messages / s",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(cluster) ( increase(misc:application:${c.get('id')}_outgoing_messages[1m]))`,
        legendFormat: "{{cluster}}"
    }))

let server_errors = new Graph({
    title: "Server errors / min",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(cluster) ( increase(misc:application:${c.get('id')}_server_errors[1m]) )`,
        legendFormat: "{{cluster}}",
    }))
    .addTarget(new PrometheusQuery({
        expr: (c) => `infra:olympus:kube_pod_container_status_restarts_total{namespace="ds-infrastructure",pod=~"${c.get('serviceName')}.*"}`,
        legendFormat: "restarts in {{cluster}}"
    }))

let client_errors = new Graph({
    title: "Client errors / min",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `sum by(status_code) ( increase(misc:application:${c.get('id')}_client_errors[1m]) )`
    }))

let heap_usage = new Graph({
    title: "JVM heap usage",
    datasource: thanos,
})
    .addTarget(new PrometheusQuery({
        expr: (c) => `max by(cluster) (max_over_time(misc:application:jvm_memory_bytes_used{service=~"${c.get('serviceName')}", area="heap"}[1m]))`,
        legendFormat: "{{cluster}}"
    }))
//

let servicesLayout = new ColumnLayout({
    columns: [
        { width: 12 },
        { width: 12 }
    ]
})

servicesLayout.addPanelsWithContext(
    0,
    new Context({
        id: "some-other-service",
        serviceName: "some-other-service-name"
    }),
    [
        Headers.service(
            "REST API",
            "https://google.com",
            "https://google.com"
        ),
        incoming,
        outgoing,
        server_errors,
        client_errors,
        heap_usage,
    ]
)

servicesLayout.addPanelsWithContext(
    1,
    new Context({
        id: "some-service",
        serviceName: "some-service-name"
    }),
    [
        Headers.service(
            "Message transformer",
            "https://google.com",
            "https://google.com"
        ),
        incoming,
        outgoing,
        server_errors,
        client_errors,
        heap_usage,
    ]
)

let dashboard = new Dashboard({
    title: "Hackweek dashboard"
}).addLayout(servicesLayout)

writeFileSync(
    './build/temp.json',
    JSON.stringify({dashboard, overwrite: true,}))