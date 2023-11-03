/* jshint esversion:8 */
//Version: 0.0.1 (beta)

import xapi from 'xapi';


let currentConfig = {};
var scheduleTimeout;

function schedule(time, action) {
  let [alarmH, alarmM] = time.split(':');
  let now = new Date();
  now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let difference = parseInt(alarmH) * 3600 + parseInt(alarmM) * 60 - now;
  if (difference <= 0) difference += 24 * 3600;
  clearTimeout(scheduleTimeout);
  scheduleTimeout = setTimeout(action, difference * 1000);
}

function displaytext(level, text) {
  switch (level) {
    case 1:
      if (currentConfig.showLogs)
        console.log(text);
      break;
    case 2:
      if (currentConfig.showWarn)
        console.warn(text);
      break;
    case 3:
      if (currentConfig.showErrors)
        console.error(text);
  }
}

async function readConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      let contentjson = await xapi.Command.Macros.Macro.Get({
        Content: 'True',
        Name: 'AutoUpdaterConfig'
      });
      let configobject = contentjson.Macro[0].Content;
      let config = configobject.substring(24);
      config = JSON.parse(config);
      currentConfig = config;
      resolve(config);
    }
    catch (e) {
      reject(e);
    }
  });
}
async function writeConfig(config) {
  let jsonconfig = JSON.stringify(config, null, 4);
  let textconfig = 'let autoupdaterconfig = ' + jsonconfig;
  await xapi.Command.Macros.Macro.Save({
    Name: 'AutoUpdaterConfig',
    Overwrite: 'True',
    Transpile: 'False'
  }, textconfig);
}


function sanitizeJSON(unsanitized){	
    return unsanitized.replace(/\n/g, "").replace(/\r/g, ""); 
}

async function updatebranch(manifestVersion, branch, manual = false) {
  return new Promise(async (resolve, reject) => {

    let branchCurrentVersion = branch.version;
    let branchUrl = branch.url.replace('%FILE%', 'manifest.json');
    displaytext(1, `Fetching update manifest`);
    xapi.Command.HttpClient.Get({
      AllowInsecureHTTPS: 'True',
      ResultBody: 'PlainText',
      Timeout: 10,
      Url: branchUrl
    }).then(response => {
      var updateFound = false;
      displaytext(1, `Got manifest. Reading...`);
      try {
        var manifest = JSON.parse(sanitizeJSON(response.Body));
        if (manifest.version == manifestVersion) {
          displaytext(1, `[Manifest version ${manifest.version}, channel "${manifest.channel}", ${manifest.updates.length} total updates available]`);
          displaytext(1, `Looking for next update...`);
          var updates = manifest.updates.sort((a, b) => a.version - b.version);


          for (let update of updates) {
            if (update.version > branchCurrentVersion) {
              displaytext(1, `New update found! Version ${branch.version} --> version ${update.version}`);
              updateConfigBranchVersion(branch.id, update.version);
              updateFound = true;
              displaytext(1, `Applying update ${update.version} (${update.file}) in ${currentConfig.updateInstallDelay} seconds.`);
              setTimeout(() => {
                let updatefile = branch.url.replace('%FILE%', update.file);
                xapi.Command.Provisioning.Service.Fetch({ Mode: update.mode, URL: updatefile }).then(() => {
                  resolve();
                }).catch(err => {
                  displaytext(3, `updatebranch error: ${err}`);
                  displaytext(3, `Update error. Reverting version in branch.`);
                  updateConfigBranchVersion(branch.id, branchCurrentVersion);
                  resolve();
                });
              }, currentConfig.updateInstallDelay * 1000);
              break;
            }
          }
          if (!updateFound) {
            displaytext(1, `Branch "${branch.id}" is up to date.`);
            resolve();
          }
        }
        else {
          console.error(3, `Manifest version not compatible. Version ${manifest.version}, expected ${manifestVersion}`);
          resolve();
        }
      }
      catch (err) {
        console.error(`Error reading manifest: ${err}`);
        console.error(sanitizeJSON(response.Body));
        resolve();
      }
    });
  });

}

function updateConfigBranchVersion(id, newVersion) {
  displaytext(1, `Updating branch "${id}" to version ${newVersion}`);
  for (let b of currentConfig.branches) {
    if (b.id == id) {
      b.version = newVersion;
      writeConfig(currentConfig);
    }

  }


}

xapi.Event.UserInterface.Extensions.Widget.Action.on(action => {
  if (action.WidgetId == 'autoupdater_update' && action.Type == 'pressed') {
    update();
  }
});


async function update() {
  let config = await readConfig();
  for (let b of config.branches) {
    displaytext(1, `Running update check for branch "${b.id}"...`);
    await updatebranch(config.manifestVersion, b, false);
  }
  displaytext(1, `System is up to date.`);
  if (currentConfig.scheduleUpdate) {
    displaytext(1, `Scheduling automatic updates for ${currentConfig.updateTime}`);
    schedule(currentConfig.updateTime, update);
  }
}



async function init() {
  xapi.Event.Message.Send.Text.on(text => {
    if (text == 'update now') {
      console.warn(`Updating NOW: Received request by terminal command.`);
      update();
    }
  });
  await readConfig();
  if (currentConfig.scheduleUpdate) {
    displaytext(1, `Scheduling automatic updates for ${currentConfig.updateTime}`);
    schedule(currentConfig.updateTime, update);
  }
  if (currentConfig.updateOnMacroStart) {
    displaytext(1, `Starting automatic updates in ${currentConfig.updateStartDelay} seconds.`);
    setTimeout(() => {
      update();
    }, currentConfig.updateStartDelay * 1000);
  }
  else {
    console.warn(`Skipping updates on start.`);
  }

}


init();



