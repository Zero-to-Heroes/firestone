import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '@models/mainwindow/main-window-state';
import { NavigationState } from '@models/mainwindow/navigation/navigation-state';
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
		const duelsInfo = await this.memory.getDuelsInfo();
		// [DungeonCrawlOptionType.TREASURE].includes(event.option)
		// 	? await this.memory.getDuelsInfo()
		// 	: null;
		const treasures = duelsInfo?.TreasureOption;
		const heroOptions = await this.memory.getDuelsHeroOptions();
		const heroPowerOptions = await this.memory.getDuelsHeroPowerOptions(10);
		// [DungeonCrawlOptionType.HERO_POWER, DungeonCrawlOptionType.TREASURE_SATCHEL].includes(
		// 	event.option,
		// )
		// 	? await this.getHeroPowerOptions()
		// 	: null;
		const signatureTreasureOptions = await this.memory.getDuelsSignatureTreasureOptions(10);
		// event.option === DungeonCrawlOptionType.TREASURE_SATCHEL ? await this.getSignatureTreasureOptions() : null;

		console.debug(
			'[duels-current-option-parser] updated pick infos',
			heroOptions,
			heroPowerOptions,
			signatureTreasureOptions,
		);
		const newState = currentState.update({
			duels: currentState.duels.update({
				currentOption: event.option,
				treasureSelection: treasures?.length
					? {
							treasures: treasures.map((option) => this.allCards.getCardFromDbfId(option)),
					  }
					: null,
				heroOptions: heroOptions,
				heroPowerOptions: heroPowerOptions,
				signatureTreasureOptions: signatureTreasureOptions,
			}),
		});
		return [newState, null];
	}

	// private async getHeroPowerOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
	// 	let retriesLeft = 15;
	// 	let result = await this.memory.getDuelsHeroPowerOptions();
	// 	while (retriesLeft >= 0 && (!result?.length || result.some((option) => option.DatabaseId === 0))) {
	// 		await sleep(500);
	// 		result = await this.memory.getDuelsHeroPowerOptions();
	// 		retriesLeft--;
	// 	}
	// 	return result;
	// }

	// private async getSignatureTreasureOptions(): Promise<readonly MemoryDuelsHeroPowerOption[]> {
	// 	let retriesLeft = 15;
	// 	let result = await this.memory.getDuelsSignatureTreasureOptions();
	// 	while (retriesLeft >= 0 && (!result?.length || result.some((option) => option.DatabaseId === 0))) {
	// 		await sleep(500);
	// 		result = await this.memory.getDuelsSignatureTreasureOptions();
	// 		retriesLeft--;
	// 	}
	// 	return result;
	// }
}
