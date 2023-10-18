import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

Error.stackTraceLimit = Infinity;
platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err));
