import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BattlegroundsLeaderboardOverlayModule } from './battlegrounds-leaderboard-overlay.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(BattlegroundsLeaderboardOverlayModule);
