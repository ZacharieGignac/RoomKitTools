import xapi from 'xapi';
import { prompt, textInput } from './xPrompts';

function runTextInputExample() {
  textInput(
    {
      Duration: 60,
      Text: 'Enter your name',
      Title: 'Question...',
      Callback: response => { console.log(`User is named ${response.Text}`) },
      Clear: () => { console.log('User did not respond....') }
    });
}

function runPromptExample() {
  prompt({
    Duration: 10,
    Options: [
      {
        Text: 'Option 1',
        Callback: response => { console.log('ONE SELECTED') }
      },
      {
        Text: 'Option 2',
        Callback: response => { console.log('TWO SELECTED') }
      },
      {
        Text: 'Option Trois',
        Callback: response => { console.log('THREE SELECTED') }
      }
    ],
    Any: response => { console.log('Any choice response: ' + response) },
    Clear: response => { console.log('Cleared response: ' + response) },
    Text: 'Text here',
    Title: 'Tittle here'
  });
}

function runChainedPromptsExample() {
  prompt({
    Duration: 10,
    Options: [
      {
        Text: 'Hot',
        Callback: response => {
          textInput(
            {
              Duration: 60,
              Text: 'HOT!! How much can you eat?',
              Title: 'Question...',
              Callback: response => { console.log(`User can eat ${response.Text} hot wings`) },
              Clear: () => { console.log('User did not respond....') }
            });
        }
      },
      {
        Text: 'Mild',
        Callback: response => {
          textInput(
            {
              Duration: 60,
              Text: 'What Mild ??? How much can you eat?',
              Title: 'Question...',
              Callback: response => { console.log(`User can eat ${response.Text}. But.... Mild wings.....`) },
              Clear: () => { console.log('User did not respond....') }
            });
        }
      }
    ],
    Clear: response => { console.log('User did not respond....') },
    Text: 'How do you like your chicken wings?',
    Title: 'Important question'
  });
}

//runPromptExample();
//runTextInputExample();
//runChainedPromptsExample();