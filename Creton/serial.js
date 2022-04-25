class SerialPort {
    constructor(config, dbg) {
        this.config = config;
        this.debug = dbg;

        if (config.driver) {
            var fs = require('fs');
            this.config.driver = JSON.parse(fs.readFileSync(this.config.driver, 'utf8'));
            this.config.baudRate = this.config.driver.Communication.Baud;
            this.timeBetweenCommands = this.config.driver.Communication.TimeBetweenCommands;
        }
        else {
            this.timeBetweenCommands = this.config.timeBetweenCommands;
        }
        const sp = require('serialport');
        const Readline = require('@serialport/parser-readline');


        this.port = new sp(this.config.device, { baudRate: this.config.baudRate });
        this.port.on('error', err => {
            console.log(`SERIAL PORT ERROR: ${err}`);
        });

        this.parser = this.port.pipe(new Readline({ delimiter: config.delimiter }));

        this.commandsBuffer = [];
        setInterval(() => {
            this.checkCommandsBuffer();
        }, this.timeBetweenCommands);
    }
    checkCommandsBuffer() {
        try {
            if (this.commandsBuffer.length > 0) {
                var currentCommand = this.commandsBuffer.shift();
                this.write(currentCommand);
            }
        }
        catch (err) {
            console.log(`ERR checkCOmmandBuffer: ${err}`);
        }
    }
    write(command) {
        if (this.debug) console.log(`${this.config.name} WRITE > ${command}`);
        this.port.write(command);
    }
    read(callback) {
        this.parser.on('data', data => {
            try {
                if (this.debug) console.log(`${this.config.name} READ > ${data}`);
                callback(data);
            }
            catch (err) {
                console.log(`ERR read: ${err}`);
            }
        });
    }
    feedback(f) {
        this.parser.on('data', data => {
            try {
                if (this.config.driver) {
                    for (const feedback of this.config.driver.feedbacks) {
                        if (data.substring(0, feedback.Header.length) == feedback.Header) {
                            f({ f: feedback.Name, d: data.substring(feedback.Header.length) });
                        }
                    }
                }
            }
            catch (err) {
                console.log(`ERR feedback: ${err}`);
            }
        });
    }
    command(cmd, args) {
        for (const driverCommand of this.config.driver.commands) {
            if (driverCommand.Name == cmd) {
                try {
                    if (args) {
                        for (const arg of Object.keys(args)) {
                            //console.log(`${arg} = ${args[arg]}`);
                            driverCommand.Value = driverCommand.Value.replaceAll('${' + arg + '}', args[arg]);
                        }
                    }
                    this.commandsBuffer.push(driverCommand.Value + this.config.delimiter);
                }
                catch (err) {
                    console.log(`ERR command: ${err}`);
                }
            }
        }
    }
}

module.exports.SerialPort = SerialPort;
