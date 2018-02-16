# NOW-sync

A tool to help developers sync local files to ServiceNow record fields. Requires [NodeJS](https://nodejs.org).

<!--

```shell
yarn global add now-sync # or `npm install -g now-sync`
```

-->

## Commands

```text
now [command]

Commands:
  now check      Checks for any config errors
  now config     Initiates config for current folder (run this first)
                                                              [aliases: init, c]
  now info       Lists information about ServiceNow instance        [aliases: i]
  now add:table  Add a new table configuration to sync with local files
                                                                   [aliases: at]
  now add        Add record files to sync with a ServiceNow record  [aliases: a]
  now pull       Overwrites all local file content with synced ServiceNow record
                 content
  now push       Overwrites all synced ServiceNow record fields with local file
                 content
  now sync       !DANGER! Perform a one-time sync on all synced local files with
                 ServiceNow records
  now watch      Watches project folder files for changes and pushes changes to
                 ServiceNow

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Quick Start

1. Install [NodeJS](https://nodejs.org). Use [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) or [asdf](https://github.com/asdf-vm/asdf) if you’d like.
1. Install this package: `yarn global add now-sync` (or `npm -g install now-sync`).
1. Run `now config` to configure your local environment.
1. Test your configuration by running `now info`.
1. Run `now add` to add a record to sync.
1. Run `now watch` to start watching local files.
1. Make some file changes, watch your file updates sync with the ServiceNow record.
1. Happy development!
