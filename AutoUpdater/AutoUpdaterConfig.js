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