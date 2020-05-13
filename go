#!/bin/bash

if [ ! -d "node_modules" ]; then
    npm install
fi

./node_modules/.bin/ts-node src/cli.ts $@
