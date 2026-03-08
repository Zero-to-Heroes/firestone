import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import {
	MainWindowState,
	NavigationState,
	NewPackEvent,
} from '../../store-internal';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CollectionBootstrapService } from '@firestone/collection/services';
import { Processor } from '../processor';

export class NewPackProcessor implements Processor {
	constructor(
		private collectionBootstrap: CollectionBootstrapService,
		private allCards: CardsFacadeService,
	) {}

	public async process(
		event: NewPackEvent,
		currentState: MainWindowState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const newPack: PackResult = {
			id: 0,
			creationDate: Date.now(),
			boosterId: event.boosterId,
			setId: event.setId,
			cardsJson: event.packCards,
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
		console.debug('[pack-history] handling new pack', newPack);
		this.collectionBootstrap.newPack(newPack);
		return [null, null];
	}
}
