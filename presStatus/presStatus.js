import xapi from 'xapi';

const PRES_NOPRES = 'PRES_NOPRESENTATION';
const PRES_LOCALPREVIEW = 'PRES_LOCALPREVIEW';
const PRES_LOCALSHARE = 'PRES_LOCALSHARE';
const PRES_REMOTE = 'PRES_REMOTE';
const PRES_REMOTELOCALPREVIEW = 'PRES_REMOTELOCALPREVIEW';

var eventSinks = [];


async function checkPresentationStatus() {
  const presStatus = await presentation.getStatus();
  processCallbacks(presStatus);
}

/*
export async function getPresentationStatus() {
  return new Promise(success => {
    var status = {};
    xapi.Status.Conference.Presentation.get().then(pres => {
      if (pres.Mode == 'Receiving') {
        status.remotePresentation = true;
      }
      else {
        status.remotePresentation = false;
      }
      if (pres.LocalInstance !== undefined) {
        status.localPresentation = true;
        status.localPresentationMode = pres.LocalInstance[0].SendingMode;
        status.source = pres.LocalInstance[0].Source;
        status.id = pres.LocalInstance[0].id;
        if (status.remotePresentation == true) {
          if (status.localPresentationMode === 'LocalOnly') {
            status.presentationType = PRES_REMOTELOCALPREVIEW;
          }
          else {
            status.presentationType = PRES_REMOTE;
          }
        }
        else {
          if (status.localPresentationMode === 'LocalOnly') {
            status.presentationType = PRES_LOCALPREVIEW;
          }
          else {
            status.presentationType = PRES_LOCALSHARE;
          }
        }
        success(status);
      }
      else {
        status.localPresentation = false;
        if (status.remotePresentation == true) {
          status.presentationType = PRES_REMOTE;
        }
        else {
          status.presentationType = PRES_NOPRES;
        }
        success(status);
      }
    });
  });
}
*/

function processCallbacks(presStatus) {
  for (const e of eventSinks) e(presStatus);
}

export var presentation = {
  onChange: function (callback) {
    eventSinks.push(callback);
  },
  getStatus: async function () {
    return new Promise(success => {
      var status = {};
      xapi.Status.Conference.Presentation.get().then(pres => {
        if (pres.Mode == 'Receiving') {
          status.remotePresentation = true;
        }
        else {
          status.remotePresentation = false;
        }
        if (pres.LocalInstance !== undefined) {
          status.localPresentation = true;
          status.localPresentationMode = pres.LocalInstance[0].SendingMode;
          status.source = pres.LocalInstance[0].Source;
          status.id = pres.LocalInstance[0].id;
          if (status.remotePresentation == true) {
            if (status.localPresentationMode === 'LocalOnly') {
              status.presentationType = PRES_REMOTELOCALPREVIEW;
            }
            else {
              status.presentationType = PRES_REMOTE;
            }
          }
          else {
            if (status.localPresentationMode === 'LocalOnly') {
              status.presentationType = PRES_LOCALPREVIEW;
            }
            else {
              status.presentationType = PRES_LOCALSHARE;
            }
          }
          success(status);
        }
        else {
          status.localPresentation = false;
          if (status.remotePresentation == true) {
            status.presentationType = PRES_REMOTE;
          }
          else {
            status.presentationType = PRES_NOPRES;
          }
          success(status);
        }
      });
    });
  }
}

async function init() {
  xapi.Event.PresentationPreviewStarted.on(checkPresentationStatus);
  xapi.Event.PresentationPreviewStopped.on(checkPresentationStatus);
  xapi.Event.PresentationStarted.on(checkPresentationStatus);
  xapi.Event.PresentationStopped.on(checkPresentationStatus);
}
init();



