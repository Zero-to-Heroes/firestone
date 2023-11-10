import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Processor } from '../processor';

export class DuelsIsOnDeckBuildingLobbyScreenProcessor implements Processor {
	constructor(private readonly memory: MemoryInspectionService, private readonly allCards: CardsFacadeService) {}

	public async process(
		event: DuelsIsOnDeckBuildingLobbyScreenEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const tempDuelsDeck = event.value ? await this.memory.getDuelsDeck() : null;
		let newDuels = currentState.duels;
		if (tempDuelsDeck && !!tempDuelsDeck.DeckList?.length) {
			newDuels = newDuels?.update({
				heroOptions: [{ DatabaseId: this.allCards.getCard(tempDuelsDeck.HeroCardId).dbfId, Selected: true }],
				heroPowerOptions: [
					{ DatabaseId: this.allCards.getCard(tempDuelsDeck.HeroPowerCardId).dbfId, Selected: true },
				],
				signatureTreasureOptions: [
					{ DatabaseId: this.allCards.getCard(tempDuelsDeck.DeckList?.[0]).dbfId, Selected: true },
				],
			});
		}
		console.debug('[duels-is-on-deck-building-lobby-screen-processor] updated pick infos', newDuels, tempDuelsDeck);
		return [
			currentState?.update({
				duels: newDuels?.update({
					isOnDuelsDeckBuildingLobbyScreen: event.value,
					// tempDuelsDeck: tempDuelsDeck,
				}),
			}),
			null,
		];
	}
}
