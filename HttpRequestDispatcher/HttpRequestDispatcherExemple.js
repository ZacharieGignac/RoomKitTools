import xapi from 'xapi';

const NUMBER_OF_REQUESTS = 200;
const HOST = 'https://www.google.com';

/* First syntax */
/*
import { HttpRequestDispatcher, HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS } from './HttpRequestDispatcher';

const hrd = new HttpRequestDispatcher();

var responses = 0;
var startTime = new Date();
console.log(`Making ${NUMBER_OF_REQUESTS} HTTP GET requests to ${HOST}`);
for (let i = 0; i < NUMBER_OF_REQUESTS; i++) {
  hrd.httpRequest({ Method: 'GET', Url: HOST })
    .then(response => {
      console.log(`Got response ${i+1} of ${NUMBER_OF_REQUESTS}`);
      responses++;
      if (responses == NUMBER_OF_REQUESTS) {
        console.log(`Finished ${NUMBER_OF_REQUESTS} in ${new Date() - startTime}ms (Using ${HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS} threads)`);
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
}
*/





/* New syntax, if you like it more */
import { hapi } from './HttpRequestDispatcher';
hapi.Command.HttpClient.Get({ URL:'https://www.google.ca'}).then(response => {
  console.log(response);
});