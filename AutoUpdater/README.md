# CURRENTLY BROKEN. WILL UPDATE NOVEMBER 3RD.

# AutoUpdater
A simple auto update system for Cisco Webex devices

# What's needed ?
* A Cisco Webex device
* The 2 macros provided
* A web server, or github will do

# Installation
* Import macro AutoUpdater.js
* Import macro AutoUpdaterConfig.js
* Modify AutoUpdaterConfig.js to suit your needs (read section bellow)
* Enable AutoUpdater.js

# AutoUpdater configuration
Be careful, this macro is not your _normal everyday_  macro. It's JSON formated, so be sure to keep the double-quotes for properties. Do not add comments. Respect the JSON.
This is an example of a configuration file:
```JS
let autoupdaterconfig = {
    "showLogs": true,
    "showWarns": true,
    "showErrors": true,
    "updateOnMacroStart": true,
    "updateStartDelay": 5,
    "updateInstallDelay": 15,
    "scheduleUpdate": true,
    "updateTime": "10:26",
    "manifestVersion": 1,
    "branches": [
        {
            "id": "dev",
            "version": 5,
            "url": "https://raw.githubusercontent.com/ZacharieGignac/MCS/main/autoupdater/dev/%FILE%?raw=true"
        },
        {
            "id": "dev2",
            "version": 2,
            "url": "https://raw.githubusercontent.com/ZacharieGignac/MCS/main/autoupdater/dev/%FILE%?raw=true"
        },
        {
            "id": "dev3",
            "version": 5,
            "url": "https://raw.githubusercontent.com/ZacharieGignac/MCS/main/autoupdater/dev/%FILE%?raw=true"
        }
    ]
}
```

## Root properties
* showLogs : true, false, Enable console.log messages.
* showWarns : true, false, Enable console.warn messages.
* showErrors : true, false, Enable console.error messages.
* updateOnMacroStart : true, false, If true, the update check will be performed automatically when the macro starts. This is needed if you want all updates in a branch to apply in chain.
* updateStartDelay : number, Number of seconds before the automatic update check is performed at the start of the macro. I recommend keeping this at ~5 seconds, in case something goes horribly wrong, you'll be able to disable the macro.
* updateInstallDelay : number, Number of seconds before the update is applied. Keep it at ~15 seconds for the same reasons.
* scheduleUpdate : true, false, If true, the update check will be scheduled each day. Check the other property bellow.
* scheduleTime : string, Time at which the update check will be performed.
* manifestVersion : number, Version of the manifest file. As long as the format is not changed, it will stay 1 for a while.
* branches : Array that contains the definition of all your update branches.

## branch properties
* id : <string> a name for your branch.
* version : <number> current version of your branch. Normally starts à zero on a new install. This number will be updated automatically to track the updates.
* url : URL for your update branch. The %FILE% string in the URL will be replaced with either the manifest file (manifest.json) or the needed update (zip file).

# Web server configuration
I'm going to use GitHub for this example. You can use your own web server.

## Create folder structure
* Create your repo. Your repo is accessible at https://github.com/MyUsername/MyRepo/blob/main/updates/dev-branch/
* Create a folder in your repo, for example "updates". Your updates root is accessible at https://github.com/MyUsername/MyRepo/blob/main/updates/dev-branch/updates
* Create a folder in the "updates" folder. This folder represents an update branch. We will call it "dev-branch". Your update branch is accessible at https://github.com/MyUsername/MyRepo/blob/main/updates/dev-branch/dev-branch

## Create your manifest
* Create a file named "manifest.json" in this directory. This file is now accessible with a URL like https://github.com/MyUsername/MyRepo/blob/main/updates/dev-branch/manifest.json?raw=true (note the ?raw=true at the end, this is needed on GitHub)

## Edit your manifest file
This is an example of update manifest file.
```JS
{
  "version": 1,
  "channel": "dev",
  "updates": [
    {
      "version": 1,
      "mode": "add",
      "file": "version1.zip"
    }
  ]
}
```
### Root properties
* version : number, This number should match the "manifestVersion" in your AutoUpdateConfig.js file. Should stay at 1 for a while.
* channel : string, A name for your branch. It _should_ match the branch name in your AutoUpdateConfig.js file.
* updates : array An array of updates object.

### updates properties
* version : number. version if this update. They AutoUpdater will apply updates from lowest to highest.
* mode : add, replace, If set to "add", the Macros and UI Extensions will be CLEARED on the system, and replaced with the new update. If set to "add", it will be ADDED, and OVERRITTEN.
* file : string, Filename in the same directory. This file must be a .zip file created with the backup functions of a codec.
