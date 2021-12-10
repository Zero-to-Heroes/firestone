import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { DeckTrackerTwitchModule } from './decktracker-twitch.module';

if (process.env.NODE_ENV === 'production') {
	enableProdMode();
}

window['amplitude'] = null;

platformBrowserDynamic().bootstrapModule(DeckTrackerTwitchModule);
