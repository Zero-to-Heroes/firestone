import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { globalEffectTriggers, globalEffectTriggersEffects } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDeckForSpecialCardEffects } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class GlobalMinionEffectParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && globalEffectTriggersEffects.includes(gameEvent.additionalData?.prefabId);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [inputCardId, controllerId, localPlayer] = gameEvent.parse();

		let cardId = inputCardId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
		// console.debug('cardId', cardId, effectTrigger, gameEvent);
		if (effectTrigger?.cardId !== cardId || effectTrigger.forceUseParentInfo) {
			cardId = gameEvent.additionalData?.parentCardId;
			effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
			// console.debug('parent cardId', cardId, effectTrigger);
			if (effectTrigger?.cardId !== cardId) {
				console.warn(
					'trying to apply global effect trigger to wrong card',
					cardId,
					inputCardId,
					effectTrigger,
					gameEvent.additionalData?.prefabId,
				);
				return currentState;
			}
		}
		// console.debug('effectTrigger', effectTrigger, cardId, globalEffectTriggers, gameEvent);

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: null,
			cardId: cardId,
			cardName: refCard.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);
		const newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		// console.debug('newGlobalEffects', newGlobalEffects, cardId, card, deck.globalEffects);
		const deckAfterSpecialCaseUpdate: DeckState = modifyDeckForSpecialCardEffects(
			cardId,
			deck,
			this.allCards,
			this.i18n,
		);
		const newPlayerDeck: DeckState = deckAfterSpecialCaseUpdate.update({
			globalEffects: newGlobalEffects,
		} as DeckState);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		} as any);
	}

	event(): string {
		return 'GlobalMinionEffectParser';
	}
}
