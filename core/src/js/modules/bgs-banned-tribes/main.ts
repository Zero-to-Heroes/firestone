import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BgsBannedTribesModule } from './bgs-banned-tribes.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(BgsBannedTribesModule);
