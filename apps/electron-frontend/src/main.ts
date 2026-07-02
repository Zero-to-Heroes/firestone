import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setupOwElectronAds } from './app/ads/ow-electron-ads';
import { AppModule } from './app/app.module';

Error.stackTraceLimit = Infinity;

// Enables ad serving for the free build (no-op in the premium build via fileReplacements).
setupOwElectronAds();

platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err));
