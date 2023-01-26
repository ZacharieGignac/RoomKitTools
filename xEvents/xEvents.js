import xapi from 'xapi';

var events = [];

export function event(eventName) {
  return (
    {
      on: function (callback) {
        events.push({
          eventName: eventName,
          callback: callback
        });
      },
      call: function () {
        let jsonobj = JSON.stringify({
          $:'$',
          e: eventName,
          a: Array.from(arguments)
        });
        xapi.Command.Message.Send({ Text: jsonobj });
      }
    }
  );
}

function executeCallbacks() {
  for (const e of events) {
    if (e.eventName == eventName) {
      e.callback.apply(null, arguments);
    }
  }
}

xapi.Event.Message.Send.Text.on(text => {
  try {
    let nativeObj = JSON.parse(text)
    if (nativeObj.e && nativeObj.a && nativeObj.$=='$') {
      for(const e of events) {
        if (e.eventName == nativeObj.e) {
          e.callback.apply(null,nativeObj.a);
        }
      }
    }
  }
  catch {  }
});
