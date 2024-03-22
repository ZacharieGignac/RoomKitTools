import xapi from 'xapi';

export const HTTPREQUESTDISPATCHER_NUMBER_OF_CLIENTS = 3; //Don't go more than 3. It will fail. 2 is even more safe, but a bit slower.
export const AUTO_CREATE_DISPATCHER = true; //Needed if using new syntax (Bobby's way)

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

var hrd;
if (AUTO_CREATE_DISPATCHER) {
  hrd = new HttpRequestDispatcher();
}

  export var hapi = {
    Command: {
      HttpClient: {
        Get: (clientParameters) => {
          clientParameters.Method = 'GET';
          return hrd.httpRequest(clientParameters);
        },
        Post: (clientParameters) => {
          clientParameters.Method = 'POST';
          return hrd.httpRequest(clientParameters);
        },
        Put: (clientParameters) => {
          clientParameters.Method = 'PUT';
          return hrd.httpRequest(clientParameters);
        },
        Delete: (clientParameters) => {
          clientParameters.Method = 'DELETE';
          return hrd.httpRequest(clientParameters);
        },
        Patch: (clientParameters) => {
          clientParameters.Method = 'PATCH';
          return hrd.httpRequest(clientParameters);
        }
      }
    }
  }
