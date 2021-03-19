import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BgsHeroSelectionOverlayModule } from './bgs-hero-selection-overlay.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(BgsHeroSelectionOverlayModule);
