module.exports.config = {
    debug:false,
    codec: {
        ip: '10.1.48.232', //your codec IP
        auth: {
            username: 'zagig',   //username
            password: 'Ieidm2f++'    //password
        }
    },
    peripheral:{
        id:'crouton',
        name:'Crouton',
        softwareVersion:'v1.0',
        serialNumber:'1234567890'
    },
    serialPorts:[
        /* Epson projector, using no driver, only raw read and write */
        {
            name:'projector',
            device:'/dev/ttyUSB0',
            baudRate:9600,
            delimiter:'\r',
            read:false
        },
            
        // Epson projector, using the Crestron driver, slightly modified. Open the .json file for more comments on modifications
        /*
        { 
            name:'monitor',  //Name of this device. You will need to refer to this name on the codec
            device:'/dev/ttyUSB0',  //Serial port. I'm using a prolific USB-SERIAL adapter. Don't know if it works with other types of ports
            baudRate:9600,
            timeBetweenCommands:250,
            delimiter:'\r'  //Command delimiter.
        }
        */
        
       /* Sharp monitor, using the Crestron driver, slightly modified. Open the .json file for more comments on modifications
       {
           name:'tv',
           device:'/dev/ttyUSB0',
           driver:'Sharp-PN-LE601.drv.json',
           //No extra delimiter for that one
       }
       */
    ],
    /* The special text "@CROUTON_ONSTART" (case-sensitive) is matched on app startup */
    triggers:[
        {
            id:'tv_on',           //id for this trigger
            text:'TV_ON',         //text to match from the codec (xapi.Command.Message)
            serialPort:'monitor', //Name of the serial port to use (see up there)
            raw:'POWR0001\r',         //Raw command to send to the serial port
            repeat:5000,            //Repeat this commande every X ms
            cancel:'tv_off'       //Cancel another trigger repeat, match its id
        },
        {
            id:'tv_off',
            text:'TV_OFF',
            serialPort:'monitor',
            raw:'POWR0000\r',
            repeat:5000,
            cancel:'tv_on'
        },
        {
            id:'ProjOn',
            text:'PROJ_POWER_ON',
            serialPort:'projector',
            raw:'PWR ON\r',
            repeat:5000,
            cancel:'ProjOff'
        },
        {
            id:'ProjOff',
            text:'PROJ_POWER_OFF',
            serialPort:'projector',
            raw:'PWR OFF\r',
            repeat:5000,
            cancel:'ProjOn',
            onStart:true
        }
    ]
}
