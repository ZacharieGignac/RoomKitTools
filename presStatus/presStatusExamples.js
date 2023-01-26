import xapi from 'xapi';

import { presentation } from './presStatus';


/* Sync example */

async function syncExample() {
  const status = await presentation.getStatus();
  console.log(status);
}
syncExample();

/* asynch example (promise) */

presentation.getStatus().then(status => {
  console.log(status);
});


/* Event-based example */
presentation.onChange(status => {
  console.log(status);
});


