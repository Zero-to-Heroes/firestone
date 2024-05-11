import { MemoryInspectionService } from '@firestone/memory';
import { DuelsAdventureInfoService } from '@legacy-import/src/lib/js/services/duels/duels-adventure-info.service';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { sleep } from '@services/utils';

export class DuelsChoosingHeroParser implements Processor {
	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly duelsMemoryCache: DuelsAdventureInfoService,
	) {}

	public async process(
		event: DuelsChoosingHeroEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// Wait until the hero picker is fully loaded
		// const adventuresInfo = await this.duelsMemoryCache.getAdventuresInfo();
		await sleep(2000);
		const heroOptions = await this.memory.getDuelsHeroOptions(); //event.value ? await this.memory.getDuelsHeroOptions() : [];
		// const heroOptions = heroOptionsDbfIds.map((dbfId) => this.allCards.getCardFromDbfId(dbfId));
		const newState = currentState.update({
			duels: currentState.duels.update({
				heroOptions: heroOptions,
				// adventuresInfo: adventuresInfo,
			}),
		});
		return [newState, null];
	}
}
