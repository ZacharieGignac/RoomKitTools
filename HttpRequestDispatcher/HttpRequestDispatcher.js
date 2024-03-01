import xapi from 'xapi';

const HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS = 3; //Don't go more than 3. It will fail. 2 is even more safe, but a bit slower.

class HttpRequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async httpRequest(url) {
    return new Promise(async (resolve, reject) => {
      this.queue.push({ url, resolve, reject });
      if (!this.isProcessing) {
        await this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { url, resolve, reject } = this.queue.shift();
    try {
      const response = await this._request(url);
      resolve(response);
    } catch (error) {
      reject(error);
    }

    await this.processQueue();
  }

  _request(clientParameters) {
    return new Promise((resolve, reject) => {
      var httpClientMethod;
      switch (clientParameters.Method.toUpperCase()) {
        case 'GET':
          httpClientMethod = xapi.Command.HttpClient.Get;
          break;
        case 'POST':
          httpClientMethod = xapi.Command.HttpClient.Post;
          break;
        case 'PUT':
          httpClientMethod = xapi.Command.HttpClient.Put;
          break;
        case 'DELETE':
          httpClientMethod = xapi.Command.HttpClient.Delete;
          break;
        case 'PATCH':
          httpClientMethod = xapi.Command.HttpClient.Patch
          break;
        default:
          reject(`Unknown HTTP method "${clientParameters.Method}"`);
      }
      delete clientParameters.Method;
      httpClientMethod(clientParameters).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
    });
  }
}

export class HttpRequestDispatcher {
  constructor() {
    console.log(`Dispatcher creating ${HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS} clients.`);
    this.clients = [];
    for (let i = 0; i < HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS; i++) {
      let newHttpRequestQueue = new HttpRequestQueue();
      newHttpRequestQueue.id = i;
      this.clients.push(newHttpRequestQueue);
    }
  }
  httpRequest(clientParameters) {
    let sortedClients = this.clients.sort((a, b) => {
      if (a.queue.length < b.queue.length) return -1;
      if (a.queue.length > b.queue.length) return 1;
      return 0;
    });
    let nextClient = sortedClients[0];
    //console.log(`Dispatching request to client ${nextClient.id}. Queue length: ${nextClient.queue.length}`);
    return nextClient.httpRequest(clientParameters);
  }

}


//EXAMPLE
/*

Simple request with promises:

const hrd = new HttpRequestDispatcher();

hrd.httpRequest({
  Method:'GET',
  Timeout:3,
  Url:'https://www.google.com'
}).then(response => {
  console.log(response);
}).catch(err => {
  console.log(error);
});




Simple request (await):


async function test() {
const hrd = new HttpRequestDispatcher();
let response = await hrd.httpRequest({
  Method:'GET',
  Timeout:3,
  Url:'https://www.google.com'
});
}

test();



*/

const NUMBER_OF_REQUESTS = 50;
const HOST = 'https://www.google.com';

const hrd = new HttpRequestDispatcher();

var responses = 0;
var startTime = new Date();
console.log(`Making ${NUMBER_OF_REQUESTS} HTTP GET requests to ${HOST}`);
for (let i = 0; i < 1000; i++) {
  hrd.httpRequest({ Method: 'GET', Url: HOST })
    .then(response => {
      responses++;
      if (responses == NUMBER_OF_REQUESTS) {
        console.log(`Finished 1000 in ${new Date() - startTime}ms (Using ${HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS} threads)`);
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
}



