import xapi from 'xapi';

import { hapi } from './HttpRequestDispatcher';
hapi.Command.HttpClient.Get({ URL:'https://www.google.ca'}).then(response => {
  console.log(response);
});
