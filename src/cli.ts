#!/usr/bin/env node
import { program } from 'commander'
import { fileSync } from 'tmp'
import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { inspect } from 'util'
import { Dashboard } from './elements/dashboard'
import { Context } from './base_types'

program
    .version('@VERSION@')
    .description("")
    .command('typed-grafana <file> [contextParameters...]')
    .option('--no-ssl', "Don't access the API via SSL (not recommended, only for local use)")
    .option('--dry-run')
    .option('--verbose')
    .option('--host <host>', 'Grafana host to deploy to', 'localhost:3000')
    .action(async (file, contextParameters, cmdObj) => {
        await main({
            file: resolve(file),
            host: cmdObj.host,
            scheme: cmdObj.ssl ? 'https' : 'http',
            verbose: cmdObj.verbose,
            context: parseContextParameters(contextParameters),
            dryRun: cmdObj.dryRun,
        })
    })
    .parseAsync(process.argv);

type StringMap = { [key: string]: string }
function parseContextParameters(params: string[]): StringMap {
    let context = {}
    params.forEach(x => {
        let [key, value] = x.split("=")
        if (!value) {
            console.error(`Found context parameter ${key} without value. Context parameter must have the format key=value. Ignoring this parameter.`)
        } else {
            context[key] = value
        }
    })
    return context
}

interface CliOptions {
    file: string,
    host: string,
    scheme: string,
    verbose: boolean,
    context: StringMap,
    dryRun: boolean,
}
async function main(opts: CliOptions) {
    if (!existsSync(opts.file)) {
        console.error(`Given file '${opts.file}' does not exist`)
        return
    }

    try {
        let imported = await import(opts.file)
        if (typeof imported?.default?.render === 'function') {
            await deploy(imported.default as Dashboard, opts)
        } else {
            console.error("The given path does not seem point to a compiled file that `export default`s a TypedGrafana Dashboard")
            process.exit(1)
        }
    } catch (error) {
        console.error(`\nThe following error ocurred trying to import '${opts.file}':`)
        console.error(error)
        process.exit(1)
    }
}

function execShellCommand(cmd): Promise<string> {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

async function deploy(dashboard: Dashboard, opts: CliOptions) {
    dashboard.setContext(new Context(opts.context))
    let request = { dashboard: dashboard.render(), overwrite: true, folderId: dashboard.folderId }

    if (!process.env.GRAFANA_API_TOKEN) {
        console.error("Please specify Grafana API token via the GRAFANA_API_TOKEN environment variable")
        process.exit(1)
    }

    if (opts.verbose) {
        console.log("Payload to be sent:", inspect(request, false, 9999, true))
    }

    const tmp = fileSync()
    writeFileSync(tmp.name, JSON.stringify(request))

    let cmd = `
    curl -sS --location --request POST '${opts.scheme}://${opts.host}/api/dashboards/db' \
        --header 'Accept: application/json' \
        --header 'Content-Type: application/json' \
        --header "Authorization: Bearer ${process.env.GRAFANA_API_TOKEN}" \
        --header 'Content-Type: text/plain' \
        --data-binary @${tmp.name}
        `

    if (opts.dryRun) {
        console.log("Dry run, exiting before sending data to Grafana. cURL command would've been:")
        console.log(cmd)
        process.exit(0)
    }

    let result = JSON.parse(await execShellCommand(cmd))

    if (result.status === 'success') {
        result.fullUrl = `${opts.scheme}://${opts.host}${result.url}`
    }

    console.log(JSON.stringify(result, null, 2))
}
