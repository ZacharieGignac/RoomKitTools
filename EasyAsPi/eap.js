const ezconfig = require('./config');
const jsxapi = require('jsxapi');
const eapserial = require('./serial');


const MSG_INIT_START = { $: { t: 1 } };
const MSG_INIT_STOP = { $: { t: 2 } };
const MSG_PORT_DECLARATION = { $: { t: 3 } }; //this is for something, future use
const MSG_RAWDATA = { $: { t: 4 } };
const MSG_SENDRAW = { $: { t: 5 } };
const MSG_SERIALCOMMAND = { $: { t: 6 } };
const MSG_FEEDBACK = { $: { t: 7 } };

const DEBUG = ezconfig.config.debug;

var triggersTimers = [];
var heartbeatInterval;
var pingTimeout;
var codec;
var xapi;


function codecConnected(x) {
    try {
        xapi = x;
        console.log('Codec connected');
        sendMessage(MSG_INIT_START); //this is for something, future use
        sendMessage(MSG_INIT_STOP);//this is for something, future use
        xapi.Command.Peripherals.Connect({
            ID: ezconfig.config.peripheral.id,
            Name: ezconfig.config.peripheral.name,
            SerialNumber: ezconfig.config.peripheral.serialNumber,
            SoftwareInfo: ezconfig.config.peripheral.softwareVersion,
            Type: 'ControlSystem'
        });
        if (DEBUG) console.log(`PERIPHERAL id=${ezconfig.config.peripheral.id} name=${ezconfig.config.peripheral.name} serial=${ezconfig.config.peripheral.serialNumber} softwareVersion=${ezconfig.config.peripheral.softwareVersion}`);
        clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            pingTimeout = setTimeout(() => {
                codec.close();
                console.log(`PING TIMEOUT`);
                process.exit(1);
                codecConnect();
            }, 5000);
            if (DEBUG) console.log(`> PING ?`);
            const value = await xapi.Config.SystemUnit.Name.get();
            if (DEBUG) console.log(`< PONG !`);
            clearInterval(pingTimeout);
            if (DEBUG) console.log(`HEARTBEAT> id=${ezconfig.config.peripheral.id}`);
            xapi.Command.Peripherals.HeartBeat({
                ID: ezconfig.config.peripheral.id,
                Timeout: 60
            });
        }, 30000);
    }
    catch (err) {
        console.log(`ERR codecConnected: ${err}`);
    }
}



function sendMessage(msg) {
    try {
        xapi.Command.Message.Send({ text: JSON.stringify(msg) });
    }
    catch (err) {
        console.log(`ERR sendMessage: ${err}`);
    }
}

function writeSerial(targetPort, command) {
    try {
        for (const port of ezconfig.config.serialPorts) {
            if (targetPort == port.name) {
                //console.log(`Writing ${command} to ${targetPort}`);
                port.serialport.write(command);
            }
        }
    }
    catch (err) {
        console.log(`Error writing ${command} to port ${targetPort}: ${err}`);
    }
}
function serialCommand(targetPort, command, args) {
    for (const port of ezconfig.config.serialPorts) {
        if (targetPort == port.name) {
            port.serialport.command(command, args);
        }
    }
}

function getDataPacket(source, data) {
    var msg = MSG_RAWDATA;
    msg.$.d = data;
    msg.$.n = source;
    return msg;
}
function getFeedbackPacket(source, feedback, data) {
    var msg = MSG_FEEDBACK;
    msg.$.n = source;
    msg.$.f = feedback;
    msg.$.d = data;
    return msg;
}
function codecConnect() {
    clearInterval(pingTimeout);
    clearInterval(heartbeatInterval);
    console.log(`Connecting to codec ${ezconfig.config.codec.ip}`);
    codec = jsxapi.connect(`ssh://${ezconfig.config.codec.ip}`, ezconfig.config.codec.auth)
        .on('error', () => {
            console.log(`Codec connection error! Reconnecting...`);
            process.exit(1);
            setTimeout(() => {
                codecConnect();
            }, 10000);
        })
        .on('ready', async (x) => {
            codecConnected(x);
            xapi.Event.Message.Send.on(value => {
                try {
                    var jsm = JSON.parse(value.Text);
                    switch (jsm.$.t) {
                        case 5:
                            writeSerial(jsm.$.p, jsm.$.d);
                            break;
                        case 6:
                            serialCommand(jsm.$.p, jsm.$.c, jsm.$.a);
                    }
                }
                catch (e) {
                    processTriggers(value.Text);
                }
            });
        });

}

function processTriggers(text) {
    var match = 0;
    if (DEBUG) console.log(`Searching for trigger "${text}"`);
    for (trigger of ezconfig.config.triggers) {
        try {
            if (text == trigger.text) {
                match++;
                if (trigger.cancel) {
                    if (DEBUG) console.log(`Cancelling timer ${trigger.cancel}`);
                    try {
                        clearInterval(triggersTimers[trigger.cancel]);
                    } catch { }
                }
                writeSerial(trigger.serialPort, trigger.raw);
                var intervalTrigger = trigger;
                if (DEBUG) console.log(`Starting timer ${trigger.id}`);
                clearInterval(triggersTimers[trigger.id]);
                if (trigger.repeat) {
                    triggersTimers[trigger.id] = setInterval(() => {
                        writeSerial(intervalTrigger.serialPort, intervalTrigger.raw);
                    }, trigger.repeat);
                }
            }
        }
        catch (err) {
            console.log(`ERR processTriggers: ${err}`);
        }
    }
    if (DEBUG) console.log(`Found ${match} match for trigger "${text}"`);
}

function init() {
    console.log(`Starting....`);
    setTimeout(() => {
        codecConnect();

        for (const port of ezconfig.config.serialPorts) {
            try {
                port.serialport = new eapserial.SerialPort(port, DEBUG);
                if (port.read) {
                    port.serialport.read(data => {
                        sendMessage(getDataPacket(port.name, data));
                    });
                    port.serialport.feedback(feedback => {
                        var x = getFeedbackPacket(port.name, feedback.f, feedback.d);
                        sendMessage(getFeedbackPacket(port.name, feedback.f, feedback.d));
                    });
                }
            }
            catch (err) {
                console.log(`EAP INIT ERROR: ` + err);
            }
        }
        for (trigger of ezconfig.config.triggers) {
            if (trigger.onStart) {
                if (DEBUG)
                    console.log(`Found on-start trigger. Executing ${trigger.id}`);
                processTriggers(trigger.text);
            }
        }
    }, 5000);



}

init();

