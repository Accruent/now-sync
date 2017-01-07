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
  info                      Lists information about ServiceNow instance
  list [record type]        Lists all records of a record type sync’d in project folder with ServiceNow
  pull [record type]        Pull all sync’d files to project folder from ServiceNow
  push                      Push all files in project folder to ServiceNow
  push [path]               Push specific file in project folder to ServiceNow
  push [record type]        Push all files of a record type to ServiceNow
  sync [record type]        Select which records of a record type to sync with ServiceNow
  watch                     Watches project folder files for changes and pushes changes to ServiceNow

Record types:

  ui-page
  ui-script
  ui-macro
  script-include
```
