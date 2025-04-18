import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';

@Injectable()
export class HearthArenaAnalyticsService {
	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
	) {
		this.init();
	}

	private init() {
		this.gameEvents.allEvents.subscribe(async (event) => {
			return;
			if (event.type === GameEvent.MATCH_METADATA) {
				const meta: HsGameMetaData = event.additionalData.metaData;
				if (meta?.GameType === GameType.GT_ARENA) {
					const isHaInstalled = await this.isHaInstalled();
					this.analytics.trackEvent('arena-game', {
						isHaInstalled: isHaInstalled,
					});
				}
			}
		});
	}

	private async isHaInstalled(): Promise<boolean> {
		const extensionsFolder = `${OverwolfService.getLocalAppDataFolder()}/Overwolf/Extensions/`;
		const haId = `eldaohcjmecjpkpdhhoiolhhaeapcldppbdgbnbc`;
		const extensions = await this.ow.listFilesInDirectory(extensionsFolder);
		console.debug('[heartharena-analytics] extensions', extensions);
		return extensions.data?.some((extension) => extension.type === 'dir' && extension.name === haId);
	}
}
