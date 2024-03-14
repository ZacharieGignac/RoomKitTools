import xapi from 'xapi';



var _cookie = [];

const cookieRefreshHeaders = ['AuthByPasswd', 'TRACKID', 'iv', 'tag', 'userid', 'userstr'];


/*


async function getTrackId(ip) {
  var result = await xapi.Command.HttpClient.Get({
    AllowInsecureHTTPS: true,
    ResultBody: 'PlainText',
    Url: `https://${ip}/userlogin.html`
  });

  var temptrackid;
  for (var header of result.Headers) {
    if (header.Key = 'Set-Cookie') {
      //console.log(header.Value);
      if (header.Value.substring(0, 7) == 'TRACKID') {
        temptrackid = header.Value.substring(header.Value.indexOf('=') + 1, header.Value.indexOf(';'));
        return temptrackid;
      }
    }
  }
}

async function login(ip, username, password) {
  var trackid = getTrackId(ip);

  var header_Cookie = `Cookie: TRACKID=${trackid}`;
  var header_Origin = `Origin: https://${ip}`;
  var header_referer = `Referer: https://${ip}/userlogin.html`;
  var receivedCookie = [];



  var result = await xapi.Command.HttpClient.Post({
    AllowInsecureHTTPS: true,
    Header: [header_Cookie, header_Origin, header_referer],
    ResultBody: 'PlainText',
    Url: `https://${ip}/userlogin.html`
  },
    `login=${username}&passwd=${password}`
  );
  var newCookie = 'Cookie: ';
  for (var header of result.Headers) {
    if (header.Key == 'Set-Cookie') {

      
      //var cookieKey = header.Value.split(';')[0].split('=')[0];
      //var cookieValue = header.Value.split(';')[0].split('=')[1];
      
      var key = header.Value.split('=')[0];
      if (cookieRefreshHeaders.includes(key)) {
        newCookie = newCookie + header.Value;
      }

    }
  }
  console.log(newCookie);
  return newCookie;
}

async function testRequest(ip, cookie) {
  var result = await xapi.Command.HttpClient.Get({
    AllowInsecureHTTPS: true,
    Header: cookie,
    ResultBody: 'PlainText',10.12.50.103
  console.log(result);

}

async function changeOsd(ip, cookie) {

  var result = xapi.Command.HttpClient.Post({
    AllowInsecureHTTPS: true,
    Header: [cookie, `Content-Type: application/json`],
    ResultBody: 'PlainText',
    Url: `https://${ip}/Device/Osd/`
  }, `{"Device":{"Osd":{"IsEnabled":true,"Text":"Crestron est vraiment bizarre"}}}
  
  `).then(result => {
    console.log(result);
  }).catch(err => {
    console.error(err);
  });

}


async function init() {
  var c = await login(IP, USERNAME, PASSWORD);
  testRequest(IP, c);
  //changeOsd(IP, c);
}

//init();



//console.log(Commands.Osd(true,'test'));



*/

const setName = name => {
  return {
    Device: {
      ControlPorts: {
        Serial: {
          Port1: {
            Id: name
          }
        }
      }
    }
  }
};

const setBaudRate = baudrate => {
  return {
    Device: {
      ControlPorts: {
        Serial: {
          Port1: {
            BaudRate: baudrate
          }
        }
      }
    }
  }
};

const setSerial = (baudRate, dataBits, stopBits, parity, hardwareHandshake, softwareHandshake) => {
  return {
    Device: {
      ControlPorts: {
        Serial: {
          Port1: {
            BaudRate: baudRate,
            DataBits: dataBits,
            StopBits: stopBits,
            Parity: parity,
            HardwareHandshake: hardwareHandshake,
            SoftwareHandshake: softwareHandshake
          }
        }
      }
    }
  }
};


class NvxClient {
  constructor(ip, username, password) {
    this.ip = ip;
    this.username = username;
    this.password = password;
    this.serialPort = {
      name: this.name
    }
    this.basedeviceurl = `https://${this.ip}/Device/`;


  }

  async init() {
    await this.login();
    setInterval(() => {
      console.warn(`Refreshing session...`);
      this.login();
    }, 62000);
  }

  async login() {
    console.log(`Login...`);
    this.trackid = await this.getTrackId(this.ip);

    var header_Cookie = `Cookie: TRACKID=${this.trackid}`;
    var header_Origin = `Origin: https://${this.ip}`;
    var header_referer = `Referer: https://${this.ip}/userlogin.html`;

    var result = await xapi.Command.HttpClient.Post({
      AllowInsecureHTTPS: true,
      Header: [header_Cookie, header_Origin, header_referer],
      ResultBody: 'PlainText',
      Url: `https://${this.ip}/userlogin.html`
    },
      `login=${this.username}&passwd=${this.password}`
    );
    var newCookie = 'Cookie: ';
    for (var header of result.Headers) {
      if (header.Key == 'Set-Cookie') {

        var key = header.Value.split('=')[0];
        if (cookieRefreshHeaders.includes(key)) {
          newCookie = newCookie + header.Value;
        }

      }
    }
    console.warn(newCookie);
    this.cookie = newCookie;
    return newCookie;
  }


  async getTrackId() {
    console.log(`Getting TrackId`);

    var result = await this.nvxGet(`https://${this.ip}/userlogin.html`);
    /*
    var result = await xapi.Command.HttpClient.Get({
      AllowInsecureHTTPS: true,
      ResultBody: 'PlainText',
      Url: `https://${this.ip}/userlogin.html`
    });
    */

    var temptrackid;
    for (var header of result.Headers) {
      if (header.Key = 'Set-Cookie') {
        console.log(header.Value);
        if (header.Value.substring(0, 7) == 'TRACKID') {
          temptrackid = header.Value.substring(header.Value.indexOf('=') + 1, header.Value.indexOf(';'));
          return temptrackid;
        }
      }
    }
  }

  async updateTrackId(result) {
    for (var header of result.Headers) {
      if (header.Key = 'Set-Cookie') {
        console.log(header.Value);
        if (header.Value.substring(0, 7) == 'TRACKID') {
          let temptrackid = header.Value.substring(header.Value.indexOf('=') + 1, header.Value.indexOf(';'));
          this.trackid = temptrackid;
        }
      }
    }
  }

  async nvxGet(url, body) {
    if (body == undefined) body = '';

    var result = await xapi.Command.HttpClient.Get({
      AllowInsecureHTTPS: true,
      Header: this.cookie,
      ResultBody: 'PlainText',
      Url: url
    }, body);

    return result;
  }

  async nvxPost(url, body) {
    if (body == undefined) body = '';
    if (typeof body == 'object') { body = JSON.stringify(body) };

    var result = await xapi.Command.HttpClient.Post({
      AllowInsecureHTTPS: true,
      Header: [this.cookie, `Content-Type: application/json`],
      ResultBody: 'PlainText',
      Url: url
    }, body);

    console.log(result.Body);
  }



  async test() {
    await this.login();
    var result = this.nvxGet(`${this.basedeviceurl}DeviceInfo`);
    /*
    var result = await xapi.Command.HttpClient.Get({
      AllowInsecureHTTPS: true,
      Header: this.cookie,
      ResultBody: 'PlainText',
      Url: `https://${this.ip}/Device/DeviceInfo`
    });
    */
    console.log(result.Body);

  }

  async checkSerialPort() {
    //await this.login();
    var result = await xapi.Command.HttpClient.Get({
      AllowInsecureHTTPS: true,
      Header: this.cookie,
      ResultBody: 'PlainText',
      Url: `https://${this.ip}/Device/ControlPorts/Serial/`
    });
    /*
    let ctrlport = JSON.parse(result.Body);
    console.log(ctrlport.Device.ControlPorts.Serial.Port1.Name);
    */
    this.updateTrackId(result);
    console.log(result.Body);
  }

  async setExtract() {
    /*
    let result = await this.nvxGet(`https://${this.ip}/Device/DeviceSpecific`);
    console.log(result.Body);
    */
    let request = {
      Device: {
        DeviceSpecific: {
          AudioMode: 'Extract'
        }
      }
    };

    this.nvxPost(this.basedeviceurl, request);

  }

  async setInsert() {
    let request = {
      Device: {
        DeviceSpecific: {
          AudioMode: 'Insert'
        }
      }
    };

    this.nvxPost(this.basedeviceurl, request);
  }

  async setOsd(text) {
    let request = {
      Device: {
        Osd: {
          IsEnabled: true,
          Text: text
        }
      }
    }
  }

  async powerOn() {
    let request = {
      Device: {
        ControlPorts: {
          Serial: {
            Port1: {
              Capabilities: {
                SerialPortType: 'Serial232'
              },
              TransmitData: 'PWR ON\r\n',
              TransmitDataFormat: 'Ascii'
            }
          }
        }
      }
    };

    await this.nvxPost(this.basedeviceurl, request);
  }
  async powerOff() {
    let request = {
      Device: {
        ControlPorts: {
          Serial: {
            Port1: {
              Capabilities: {
                SerialPortType: 'Serial232'
              },
              TransmitData: 'PWR OFF\r\n',
              TransmitDataFormat: 'Ascii'
            }
          }
        }
      }
    };

    await this.nvxPost(this.basedeviceurl, request);
  }

  async mute() {
    let request = {
      Device: {
        ControlPorts: {
          Serial: {
            Port1: {
              Capabilities: {
                SerialPortType: 'Serial232'
              },
              TransmitData: 'MUTE ON\r\n',
              TransmitDataFormat: 'Ascii'
            }
          }
        }
      }
    };

    await this.nvxPost(this.basedeviceurl, request);
  }


  async unmute() {
    let request = {
      Device: {
        ControlPorts: {
          Serial: {
            Port1: {
              Capabilities: {
                SerialPortType: 'Serial232'
              },
              TransmitData: 'MUTE OFF\r\n',
              TransmitDataFormat: 'Ascii'
            }
          }
        }
      }
    };

    await this.nvxPost(this.basedeviceurl, request);
  }


  async getInputStatus() {
    let result = await this.nvxGet(`http://${this.ip}/Device/AudioVideoInputOutput/`, '');
    let rawdata = result.Body;
    let data = JSON.parse(rawdata);
    let sync = data.Device.AudioVideoInputOutput.Inputs[0].Ports[0].IsSyncDetected;
    return sync;
  }


}






async function test() {
  var nvxc = new NvxClient('10.12.50.149', 'admin', 'password');
  await nvxc.init();
  //nvxc.setOsd('?');

  //nvxc.setExtract();

  xapi.Event.UserInterface.Extensions.Widget.Action.on(value => {
    if (value.Type == 'pressed') {
      if (value.Value == 'insert') {
        nvxc.setInsert();
      }
      else if (value.Value == 'extract') {
        nvxc.setExtract();
      }
      else if (value.WidgetId == 'epsonpwron') {
        nvxc.powerOn();
      }
      else if (value.WidgetId == 'epsonpwroff') {
        nvxc.powerOff();
      }
      else if (value.WidgetId == 'epsonmute') {
        nvxc.mute();
      }
      else if (value.WidgetId == 'epsonunmute') {
        nvxc.unmute();
      }
    }
  });


  xapi.Status.Audio.Volume.on(vol => {
    console.log(vol);
    nvxc.setOsd(`Volume: ${vol}`);
  });

  /*
  setInterval(async () => {
    let status = await nvxc.getInputStatus();
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: 'input1sync',
      Value: status ? 'on' : 'off'
    });
  }, 1000);
  */





}

test();






