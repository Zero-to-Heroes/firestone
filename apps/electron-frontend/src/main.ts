import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setupOwElectronAds } from './app/ads/ow-electron-ads';
import { AppModule } from './app/app.module';

Error.stackTraceLimit = Infinity;

// Enables ad serving for the free build (no-op in the premium build via fileReplacements).
setupOwElectronAds();

platformBrowserDynamic()
	// Coalesce change detection triggered by event bursts (mousemove, scroll, ...) into a single
	// pass per animation frame instead of one synchronous pass per event
	.bootstrapModule(AppModule, { ngZoneEventCoalescing: true })
	.catch((err) => console.error(err));
