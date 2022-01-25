import xapi from 'xapi';

const ENABLE_SAUCE = true; //Mettre à 'false' pour la calibration
const LIVE_CALIBRATION = false; //Une autre bonne solution pour la calibration
const SHOW_BOOST_MODE = true; //Montre le mode actuel dans la console (désactiver avant de mettre en prod!)
const SHOW_PROCESSING_TIME = false; //Montre le nombre de temps en MS pour le processing du DSP (le plus bas possible semble 198ms)
const SAMPLE_INTERVAL = 50; //Je ne recommande pas <50ms. Entre 50 et 100 semble un bon choix
const NUMBER_OF_SAMPLES = 2; //Nombre de lecture de VU fait. Une moyenne en est tirée. NUMBER_OF_SAMPLES * SAMPLE_INTERVAL


const CALIBRATION_SAMPLES = 20; //Nombre de lectures pour la calibration: CALIBRATION_SAMPLES * SAMPLE_INTERVAL * NUMBER_OF_SAMPLES

var config = {
  presenterMics: [
    {
      connector: 6,
      gains: [
        {
          gain: 64,
          silence: 20
        },
        {
          gain: 70,
          silence: 25
        },
        {
          gain: 'default',
          silence: 20
        }
      ]
    },
    {
      connector: 8,
      gains: [
        {
          gain: 56,
          silence: 15
        },
        {
          gain: 70,
          silence: 25
        },
        {
          gain: 'default',
          silence: 15
        }
      ]
    }
  ],

  roomMics: [
    {
      connector: 1,
      gain: 51
    },
    {
      connector: 2,
      gain: 51
    },
    {
      connector: 3,
      gain: 51
    }
  ],
  roomMicsBoost: 10
}


var sampleCount = 0;
var sampleAverage = 0;
var calMin;
var calMax;
var calAverage;
var calSamples = 0;
var vuMeterSink;
var silentStatus = [];
var consSamples = 0;
var boostMode;

async function startSampling() {
  await xapi.Command.Audio.VuMeter.StopAll();


  for (const mic of config.presenterMics) {
    await xapi.Command.Audio.VuMeter.Start({
      ConnectorId: mic.connector,
      ConnectorType: 'Microphone',
      IncludePairingQuality: 'Off',
      IntervalMs: SAMPLE_INTERVAL,
      Source: 'AfterAEC'
    });
  }



  console.log('Starting sampling...');

  for (const mic of config.presenterMics) {
    var gain = await xapi.Config.Audio.Input.Microphone[mic.connector].Level.get();
    gain = parseInt(gain);
    xapi.Config.Audio.Input.Microphone[mic.connector].Level.on(newGain => {
      getCurrentGains();
    });
  }

  listenToVuMeter();
}

function listenToVuMeter() {
  console.log('Sampling...');
  xapi.Event.Audio.Input.Connectors.Microphone.on(status => {

    if (!ENABLE_SAUCE) {
      if (vuMeterSink) {
        vuMeterSink(status);
      }
    }
    else {

      for (var imics = 0; imics < config.presenterMics.length; imics++) {
        var currentMic = config.presenterMics[imics];
        if (currentMic.connector == status.id) {
          var currentGain = currentMic.currentGain;
          for (var igains = 0; igains < currentMic.gains.length; igains++) {
            var gainSetting = currentMic.gains[igains];
            var gain = gainSetting.gain;
            var silence = gainSetting.silence;
            if (currentGain == gain || gain == 'default') {
              if (currentMic.sampleCount == 0 && SHOW_PROCESSING_TIME) {
                let ticks = new Date().getTime();
                currentMic.ticks = ticks;
              }
              if (currentMic.sampleCount < NUMBER_OF_SAMPLES) {
                currentMic.sampleAverage = (currentMic.sampleAverage + parseInt(status.VuMeter)) / 2;
                currentMic.sampleCount++;
              }
              else {
                if (SHOW_PROCESSING_TIME) {
                  let ticks = new Date().getTime();
                  let elapsed = ticks - currentMic.ticks;
                  console.log(`${NUMBER_OF_SAMPLES} samples of ${SAMPLE_INTERVAL}ms TOTAL -> ${elapsed}ms`);
                }

                if (LIVE_CALIBRATION) {
                  console.log(currentMic.connector + '[' + currentGain + ']->' + currentMic.sampleAverage);
                }
                if (currentMic.sampleAverage < silence) {
                  silentStatus[currentMic.connector] = true;
                }
                else {
                  silentStatus[currentMic.connector] = false;
                }

                if (silentStatus.includes(false)) {
                  boostRoomMics(false);
                }
                else {
                  boostRoomMics(true);
                }



                currentMic.sampleCount = 0;
                currentMic.sampleAverage = 0;
              }
              break;
            }
          }
        }
      }
    }
  });
}

async function calibrateInput(connector, mode) {
  return new Promise(resolve => {
    calMin = 0;
    calMax = 0;
    calAverage = 0;
    calSamples = 0;
    xapi.Config.Audio.Input.Microphone[connector].Level.get().then(micGain => {
      console.log(`Calibration started for input ${connector}. MODE=${mode}, GAIN=${micGain}`);

      vuMeterSink = (level) => {
        //console.log(level);
        if (sampleCount < NUMBER_OF_SAMPLES) {
          sampleAverage = (sampleAverage + parseInt(level.VuMeter)) / 2;
          sampleCount++;
        }
        else {
          calAverage = (calAverage + sampleAverage) / 2;
          if (calAverage < calMin) {
            calMin = calAverage;
          }
          if (calAverage > calMax) {
            calMax = calAverage;
          }
          calSamples++;
          sampleCount = 0;
          sampleAverage = 0;
          if (calSamples >= CALIBRATION_SAMPLES) {
            console.log(`Calibration finished!`);
            calMin = Math.floor(calMin);
            calMax = Math.floor(calMax);
            calAverage = Math.floor(calAverage);
            resolve(calAverage);
            vuMeterSink = undefined;
          }
        }
      }
    });

  });

}

function boostRoomMics(boost) {
  if (boost != boostMode) {
    if (boost) {
      if (LIVE_CALIBRATION || SHOW_BOOST_MODE) {
        console.log(`---BOOST--->`);
      }
    }
    else {
      if (LIVE_CALIBRATION || SHOW_BOOST_MODE) {
        console.log(`<---NORMAL---`);
      }
    }
    for (const mic of config.roomMics) {
      let newGain = mic.gain + (boost ? config.roomMicsBoost : 0);
      newGain = newGain > 70 ? 70 : newGain;
      xapi.Config.Audio.Input.Microphone[mic.connector].Level.set(newGain);
      boostMode = (boost ? true : false);
    }
  }
}

async function cal(input) {
  return new Promise(resolve => {
    console.log(`SILENCE!!! Si la calibration du silence n'est pas terminé dans 30 secondes, parlez jusqu'à ce que la prochaine étape s'affiche. Considérez le silence étant "0"`);
    calibrateInput(input, 'SILENCE').then(silenceResult => {
      console.log(`LIRE LA PHRASE SUIVANTE: Ce système augmente le gain des microphones de la salles lorsque tout les microphones de présentation sont silencieux. Dès que le présentateur commence à parler, les microphones de la salles sont reconfigurés à leur niveau normal afin de donner une priorité au présentateur.`);
      calibrateInput(input, 'SPEECH').then(speechResult => {
        console.log(`Silence: ${silenceResult}`);
        console.log(`Voix: ${speechResult}`);
        resolve();
      });
    });
  });
}

function initDefaults() {
  boostMode = false;
  for (const mic of config.roomMics) {
    xapi.Config.Audio.Input.Microphone[mic.connector].Level.set(mic.gain);
  }
  for (const mic of config.presenterMics) {
    mic.currentGain = 0;
    mic.sampleAverage = 0;
    mic.sampleCount = 0;
  }
}

async function getCurrentGains() {

  for (const mic of config.presenterMics) {
    var gain = await xapi.Config.Audio.Input.Microphone[mic.connector].Level.get();
    mic.currentGain = gain;
  }
}


function catchCalibrationCommands() {
  xapi.Status.Call.on(e => {
    if (e.RemoteNumber) {
      switch (e.RemoteNumber.substring(0, 4)) {
        case '.cal':
          var input = e.RemoteNumber.split(' ')[1];
          cal(input);
          break;
      }
    }
  });
}

async function init() {
  catchCalibrationCommands();
  initDefaults();
  boostRoomMics(false);
  await getCurrentGains();
  startSampling();


}

init();


