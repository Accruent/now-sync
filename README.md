# NOW Sync

A tool to help developers sync their JavaScript resources with ServiceNow.

```shell
yarn global add now-sync # or `npm install -g now-sync`
```

## Commands

```
Usage: now [command]

Commands:

  config                    Initiates config for current folder (instance url, auth type, etc.)
  create                    Create a record on ServiceNow and sync it with its local file in project folder.
  delete [path]             Removes file from ServiceNow and project folder
  help                      Displays this help prompt
  info                      Lists information about ServiceNow instance (url, version, etc.)
  list [record type]        Lists all records of a record type sync’d in project folder with ServiceNow
  pull [record type]        Pull all files of a record type to project folder from ServiceNow. Also registers all files for syncing
  push                      Push all files in project folder to ServiceNow
  push [path]               Push specific file in project folder to ServiceNow
  push [record type]        Push all files of a record type to ServiceNow
  sync [record type]        Select which records of a record type to sync with ServiceNow
  watch                     Watches project folder files for changes and pushes changes to ServiceNow

Record types:

  ui-script
  script-include
```
