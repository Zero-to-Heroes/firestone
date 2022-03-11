import { DungeonCrawlOptionType } from '@firestone-hs/reference-data';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
import { MemoryDuelsHeroPowerOption } from '@models/memory/memory-duels';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { Processor } from '@services/mainwindow/store/processors/processor';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { sleep } from '@services/utils';

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
		const heroPowerOptions = [DungeonCrawlOptionType.HERO_POWER, DungeonCrawlOptionType.TREASURE_SATCHEL].includes(
			event.option,
		)
			? await this.getHeroPowerOptions()
			: null;
		const signatureTreasureOptions =
			event.option === DungeonCrawlOptionType.TREASURE_SATCHEL ? await this.getSignatureTreasureOptions() : null;

		const newState = currentState.update({
			duels: currentState.duels.update({
				currentOption: event.option,
				treasureSelection: treasures?.length
					? {
							treasures: treasures.map((option) => this.allCards.getCardFromDbfId(option)),
					  }
					: null,
				heroPowerOptions: heroPowerOptions,
				signatureTreasureOptions: signatureTreasureOptions,
			}),
		});
		return [newState, null];
	}

	private async getHeroPowerOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
		let retriesLeft = 15;
		let result = await this.memory.getDuelsHeroPowerOptions();
		while (retriesLeft >= 0 && (!result?.length || result.some((option) => option.DatabaseId === 0))) {
			console.debug('[duels-current-option-parser] hero powers not ready yet, retrying', result);
			await sleep(500);
			result = await this.memory.getDuelsHeroPowerOptions();
			retriesLeft--;
		}
		return result;
	}

	private async getSignatureTreasureOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
		let retriesLeft = 15;
		let result = await this.memory.getDuelsSignatureTreasureOptions();
		while (retriesLeft >= 0 && (!result?.length || result.some((option) => option.DatabaseId === 0))) {
			console.debug('[duels-current-option-parser] signature treasures not ready yet, retrying', result);
			await sleep(500);
			result = await this.memory.getDuelsSignatureTreasureOptions();
			retriesLeft--;
		}
		return result;
	}
}
