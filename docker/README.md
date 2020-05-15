# TypedGrafana example

This setup lets you experiment with TypedGrafana without having to install anything beyond docker.

## Usage

Run `docker-compose up`. You will then be able to:

* Access Grafana via http://localhost:3000
    * The username is "admin" and the password is "password".
    * Try running an API call with `curl -H "Authorization: Bearer eyJrIjoiMFo0aHdJbGFyajZzVDVab2NJbUJXVzd1REJjVjBCTDkiLCJuIjoiVGVzdCBrZXkiLCJpZCI6MX0=" http://localhost:3000/api/dashboards/home`
* Access Prometheus via http://localhost:9090 
    * No authentication needed
