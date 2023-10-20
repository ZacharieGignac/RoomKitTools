let autoupdaterconfig = {
    "showLogs": true,
    "showWarns": true,
    "showErrors": true,
    "updateOnMacroStart": true,
    "updateStartDelay": 5,
    "updateInstallDelay": 15,
    "scheduleUpdate": true,
    "updateTime": "04:00",
    "manifestVersion": 1,
    "branches": [
        {
            "id": "my own webserver",
            "version": 0,
            "url": "https://mycompany.com/dev-branch/%FILE%"
        },
        {
            "id": "Github",
            "version": 0,
            "url": "https://raw.githubusercontent.com/MyGithubUser/updates/main/autoupdater/dev-branch/%FILE%?raw=true"
        }
    ]
}
