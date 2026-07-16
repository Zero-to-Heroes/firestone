import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

Error.stackTraceLimit = Infinity;
platformBrowserDynamic()
	// Coalesce change detection triggered by event bursts (mousemove, scroll, ...) into a single
	// pass per animation frame instead of one synchronous pass per event
	.bootstrapModule(AppModule, { ngZoneEventCoalescing: true })
	.catch((err) => console.error(err));
