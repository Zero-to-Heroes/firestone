import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
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
		return (
			state &&
			gameEvent.type === GameEvent.SUB_SPELL_START &&
			globalEffectTriggersEffects.includes(gameEvent.additionalData?.prefabId)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [inputCardId, controllerId, localPlayer] = gameEvent.parse();

		let cardId = inputCardId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
		if (effectTrigger?.cardId !== cardId) {
			cardId = gameEvent.additionalData?.parentCardId;
			effectTrigger = globalEffectTriggers.find((e) => e.cardId === cardId);
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
			cardName: this.i18n.getCardName(cardId, refCard.name),
			manaCost: refCard?.cost,
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
