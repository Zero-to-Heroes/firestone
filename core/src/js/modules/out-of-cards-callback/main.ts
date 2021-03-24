import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { OutOfCardsCallbackModule } from './out-of-cards-callback.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(OutOfCardsCallbackModule);
