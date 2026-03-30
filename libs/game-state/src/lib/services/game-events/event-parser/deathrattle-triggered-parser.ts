import { CardIds } from '@firestone-hs/reference-data';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { deathrattleGlobalEffectCards } from '../../hs-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class DeathrattleTriggeredParser implements EventParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly helper: DeckManipulationHelper,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let newGlobalEffects = deck.globalEffects;
		if (deathrattleGlobalEffectCards.includes(cardId as CardIds)) {
			const refCard = this.allCards.getCard(cardId);
			const card = DeckCard.create({
				entityId: undefined as unknown as number,
				cardId: cardId,
				cardName: refCard.name,
				refManaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: undefined,
			});
			newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		}

		let bonelordFrostwhisperFirstTurnTrigger = deck.bonelordFrostwhisperFirstTurnTrigger;
		if (cardId === CardIds.BonelordFrostwhisper) {
			bonelordFrostwhisperFirstTurnTrigger =
				deck.bonelordFrostwhisperFirstTurnTrigger || currentState.gameTagTurnNumber;
		}
		const newPlayerDeck = deck.update({
			lastDeathrattleTriggered: cardId,
			bonelordFrostwhisperFirstTurnTrigger: bonelordFrostwhisperFirstTurnTrigger,
			globalEffects: newGlobalEffects,
		});
		const [playerDeckAfterSpecialCase, opponentDeckAfterSpecialCase] = modifyDecksForSpecialCards(
			cardId,
			entityId,
			false,
			newPlayerDeck,
			opponentDeck,
			this.allCards,
			this.helper,
			this.i18n,
		);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: playerDeckAfterSpecialCase,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeckAfterSpecialCase,
		});
	}

	event(): string {
		return GameEvent.DEATHRATTLE_TRIGGERED;
	}
}
