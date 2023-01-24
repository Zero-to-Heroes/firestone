import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

// function registerObservableDebug() {
// 	const oldSubscribe = (BehaviorSubject.prototype as any)._subscribe;
// 	(BehaviorSubject.prototype as any)._subscribe = function (subscriber) {
// 		subscriber.subscriberStack = new Error().stack?.split('\n').filter((line) => line.includes('main.js'));
// 		subscriber.debugStack = new Error().stack?.split('\n');
// 		subscriber.subscriberId = uuid();
// 		// console.debug('subscribing', subscriber, new Error());
// 		return oldSubscribe.apply(this, arguments);
// 	};
// }

// registerObservableDebug();

Error.stackTraceLimit = Infinity;
platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err));
