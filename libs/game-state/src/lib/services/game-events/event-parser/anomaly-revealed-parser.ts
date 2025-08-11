import { MatchInfo } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class AnomalyRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: undefined,
			cardId: cardId,
			cardName: refCard.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: undefined,
		});
		const newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		const newPlayerDeck: DeckState = deck.update({
			globalEffects: newGlobalEffects,
		} as DeckState);
		const matchInfo: MatchInfo = {
			...(currentState.matchInfo ?? ({} as MatchInfo)),
			anomalies: (currentState.matchInfo?.anomalies ?? []).concat([cardId]),
		};
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
			matchInfo: matchInfo,
		});
	}

	event(): string {
		return GameEvent.ANOMALY_REVEALED;
	}
}
