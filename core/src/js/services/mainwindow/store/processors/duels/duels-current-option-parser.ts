import { DungeonCrawlOptionType } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';

export class DuelsCurrentOptionParser implements Processor {
	constructor(private readonly allCards: CardsFacadeService, private readonly memory: MemoryInspectionService) {}

	public async process(
		event: DuelsCurrentOptionEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const duelsInfo = [DungeonCrawlOptionType.TREASURE].includes(event.option)
			? await this.memory.getDuelsInfo()
			: null;
		const treasures = duelsInfo?.TreasureOption;
		const heroPowerOptions =
			event.option === DungeonCrawlOptionType.HERO_POWER ? await this.memory.getDuelsHeroPowerOptions() : null;
		const newState = currentState.update({
			duels: currentState.duels.update({
				currentOption: event.option,
				treasureSelection: treasures?.length
					? {
							treasures: treasures.map((option) => this.allCards.getCardFromDbfId(option)),
					  }
					: null,
				heroPowerOptions: heroPowerOptions,
			}),
		});
		return [newState, null];
	}
}
