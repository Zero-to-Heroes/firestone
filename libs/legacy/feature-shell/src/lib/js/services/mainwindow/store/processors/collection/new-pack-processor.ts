import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionBootstrapService } from '../../collection-bootstrap.service';
import { NewPackEvent } from '../../events/collection/new-pack-event';
import { Processor } from '../processor';

export class NewPackProcessor implements Processor {
	constructor(private collectionBootstrap: CollectionBootstrapService, private allCards: CardsFacadeService) {}

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
			cards: event.packCards.map((card) => {
				const result: CardPackResult = {
					cardId: card.cardId,
					cardType: card.cardType as any,
					cardRarity: (this.allCards.getCard(card.cardId)?.rarity?.toLowerCase() ??
						this.allCards.getCard(card.mercenaryCardId)?.rarity?.toLowerCase()) as
						| 'common'
						| 'rare'
						| 'epic'
						| 'legendary',
					currencyAmount: card.currencyAmount,
					mercenaryCardId: card.mercenaryCardId,
					isNew: card.isNew,
					isSecondCopy: card.isSecondCopy,
				};
				return result;
			}),
		};
		console.log('[pack-history] handling new pack', newPack);
		this.collectionBootstrap.newPack(newPack);
		return [null, null];
	}
}
