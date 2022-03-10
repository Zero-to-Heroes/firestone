import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { sleep } from '@services/utils';

export class DuelsChoosingHeroParser implements Processor {
	constructor(private readonly allCards: CardsFacadeService, private readonly memory: MemoryInspectionService) {}

	public async process(
		event: DuelsChoosingHeroEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// Wait until the hero picker is fully loaded
		await sleep(2000);
		const heroOptionsDbfIds = event.value ? await this.memory.getDuelsHeroOptions() : [];
		// const heroOptions = heroOptionsDbfIds.map((dbfId) => this.allCards.getCardFromDbfId(dbfId));
		const newState = currentState.update({
			duels: currentState.duels.update({
				heroOptionsDbfIds: heroOptionsDbfIds,
			}),
		});
		return [newState, null];
	}
}
