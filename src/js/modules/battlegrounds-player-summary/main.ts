import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BattlegroundsPlayerSummaryModule } from './battlegrounds-player-summary.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(BattlegroundsPlayerSummaryModule);
