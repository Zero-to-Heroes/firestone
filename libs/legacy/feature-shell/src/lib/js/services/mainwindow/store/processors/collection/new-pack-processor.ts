import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { NewPackEvent } from '../../events/collection/new-pack-event';
import { Processor } from '../processor';

export class NewPackProcessor implements Processor {
	constructor(private collectionManager: CollectionManager, private allCards: CardsFacadeService) {}

	public async process(
		event: NewPackEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newPack: PackResult = {
			id: 0,
			creationDate: Date.now(),
			boosterId: event.boosterId,
			setId: event.setId,
			cards: event.packCards.map(
				(card) =>
					({
						cardId: card.cardId,
						cardType: card.cardType,
						cardRarity:
							this.allCards.getCard(card.cardId)?.rarity?.toLowerCase() ??
							this.allCards.getCard(card.mercenaryCardId)?.rarity?.toLowerCase(),
						currencyAmount: card.currencyAmount,
						mercenaryCardId: card.mercenaryCardId,
					} as CardPackResult),
			),
		};
		console.log('[pack-history] handling new pack', newPack);
		// Save the new pack info
		const newPackStats: readonly PackResult[] = [newPack, ...(currentState.binder.packStats ?? [])];
		console.debug('[pack-history] newPackStats', newPackStats);

		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			packStats: newPackStats,
		} as BinderState);
		return [
			currentState.update({
				binder: newBinder,
			} as MainWindowState),
			null,
		];
	}
}
