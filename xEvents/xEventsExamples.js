import xapi from 'xapi';
import { event } from './xEvents';


//Écoute pour l'événement "TwoArgsEvent", recoit 2 arguments
event('TwoArgsEvent').on((name, age) => {
  console.log(`Name = ${name}, Age = ${age}`);
});
//Appel l'événement "TwoArgsEvent" avec 2 événenements
event('TwoArgsEvent').call('zac',40);





//Écoute pour l'événement "NativeObjectAsParameter"
event('NativeObjectAsParameter').on(obj => {
  console.log(obj);
});
//Appel l'événement "NativeObjectAsParameter" avec un objet natif
let obj = {
  premier:'test',
  deuxieme:30,
  tableau:[1,2,3,4,5]
}
event('NativeObjectAsParameter').call(obj);




//Register une function à executer à partir d'un événement
function functionFromEvent(arg) {
  console.log(`functionFromEvent appelée avec argument: ${arg}`);
}
event('FunctionFromEvent').on(functionFromEvent);
//Appel le event "FunctionFromEvent"
event('FunctionFromEvent').call('Mon argument 1');




//Créé une function callable à partir d'un événement
let myCallableEventAsFunction = event('FunctionFromEvent').call;
//Execute la function directement
myCallableEventAsFunction('yep ça marche');


