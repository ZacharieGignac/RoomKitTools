import xapi from 'xapi';

var prompts = [];


xapi.Event.UserInterface.Message.Prompt.Response.on(value => processResponse(value));
xapi.Event.UserInterface.Message.Prompt.Cleared.on(value => processCleared(value));
xapi.Event.UserInterface.Message.TextInput.Response.on(value => processTextInputResponse(value));
xapi.Event.UserInterface.Message.TextInput.Cleared.on(value => processTextInputCleared(value));


function generateUniqueID() {
  const millisecondsSinceEpoch = Date.now().toString(36);
  const randomNumber = Math.floor(Math.random() * 1000000000000).toString(36);
  const randomNumber2 = Math.floor(Math.random() * 1000000000000).toString(36);
  return `${millisecondsSinceEpoch}${randomNumber}${randomNumber2}`;
}

function processCleared(response) {
  var match = prompts.filter(p => { return (p.FeedbackId == response.FeedbackId) });
  for (const m of match) {
    if (m.Clear) m.Clear(response);
    prompts.splice(prompts.indexOf(m), 1);;
  }
}
function processResponse(response) {
  var match = prompts.filter(p => { return (p.FeedbackId == response.FeedbackId) });
  for (const m of match) {
    m.Options[response.OptionId - 1].Callback(response);
    if (m.Any) m.Any(response);
    prompts.splice(prompts.indexOf(m), 1);;
  }
}
function processTextInputResponse(response) {
  var match = prompts.filter(p => { return (p.FeedbackId == response.FeedbackId) });
  for (const m of match) {
    if (m.Callback) { m.Callback(response) };
    prompts.splice(prompts.indexOf(m), 1);;
  }
}
function processTextInputCleared(response) {
  var match = prompts.filter(p => { return (p.FeedbackId == response.FeedbackId) });
  for (const m of match) {
    if (m.Clear) { m.Clear(response) };
    prompts.splice(prompts.indexOf(m), 1);;
  }
}

export function textInput(textinput) {
  textinput.FeedbackId = textinput.FeedbackId ? textinput.FeedbackId : generateUniqueID();
  prompts.push(Object.assign({}, textinput));
  delete (textinput.Callback);
  xapi.Command.UserInterface.Message.TextInput.Display(textinput);
}
export function prompt(prompt) {
  prompt.FeedbackId = prompt.FeedbackId ? prompt.FeedbackId : generateUniqueID();
  if (prompt.Options) {
    var i = 0;
    for (const o of prompt.Options) {
      prompt[`Option.${++i}`] = o.Text;
    }
  }
  prompts.push(Object.assign({}, prompt));
  delete (prompt.Options);
  delete (prompt.Any);
  xapi.Command.UserInterface.Message.Prompt.Display(prompt);
}