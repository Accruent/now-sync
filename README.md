# NOW-sync

A tool to help developers sync local files to ServiceNow record fields. Requires [NodeJS](https://nodejs.org).

<!--

```shell
yarn global add now-sync # or `npm install -g now-sync`
```

-->

## Commands

```text
Usage: now [command]


  Commands:

    config      Initiates config for current folder (run this first)
    info        Lists information about ServiceNow instance
    add:table   Add a new table configuration to sync with local files
    add         Add local files to sync with a ServiceNow record
    sync        Perform a one-time sync on all local files with ServiceNow records
    watch       Watches project folder files for changes and pushes changes to ServiceNow

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## Quick Start

1. Install [NodeJS](https://nodejs.org). Use [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) if you’d like.
1. Install this package: `npm install -g git+ssh://git@github.com:theconnectiv/now-sync.git`.
1. Run `now config` to configure your local environment.
1. Test your configuration by running `now info`.
1. Run `now add` to add a record to sync.
1. Run `now watch` to start watching local files.
1. Make some file changes, watch your file updates sync with the ServiceNow record.
1. Happy development!
