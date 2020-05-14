#!/usr/bin/env node
import { program } from 'commander'
import { fileSync } from 'tmp'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

program
    .version('@VERSION@')
    .description("")
    .command('typed-grafana <file>')
    .option('--no-ssl', "Don't access the API via SSL (not recommended, only for local use)")
    .option('--host <host>', 'Grafana host to deploy to', 'localhost:3000')
    .action(async (file, cmdObj) => {
        await main({
            file: resolve(file),
            host: cmdObj.host,
            scheme: cmdObj.ssl ? 'https' : 'http'
        })
    })
    .parseAsync(process.argv);

interface CliOptions {
    file: string,
    host: string,
    scheme: string,
}
async function main(opts: CliOptions) {
    try {
        let imported = await import(opts.file)
        if (typeof imported?.default?.render === 'function') {
            await deploy(imported.default.render(), opts)
        } else {
            console.error("The given path does not seem point to a compiled file that `export default`s a TypedGrafana Dashboard")
        }
    } catch (error) {
        console.error(`The following error ocurred trying to import '${opts.file}':`)
        console.error(error)
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

async function deploy(dashboard: string, opts: CliOptions) {
    const tmp = fileSync()
    writeFileSync(tmp.name, JSON.stringify({ dashboard, overwrite: true, }))
    let cmd = `
curl -v --location --request POST '${opts.scheme}://${opts.host}/api/dashboards/db' \
    --header 'Accept: application/json' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${process.env.GRAFANA_API_TOKEN}" \
    --header 'Content-Type: text/plain' \
    --data-binary @${tmp.name}
    `
    let result = JSON.parse(await execShellCommand(cmd))
    console.log(result)

    if (result.status === 'success') {
        console.log(`Dashboard URL is ${opts.scheme}://${opts.host}${result.url}`)
    }
}
