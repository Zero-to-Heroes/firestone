import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BattlegroundsMouseOverOverlayModule } from './battlegrounds-mouse-over.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(BattlegroundsMouseOverOverlayModule);
