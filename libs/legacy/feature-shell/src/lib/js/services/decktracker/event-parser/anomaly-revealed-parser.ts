import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { MatchInfo } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class AnomalyRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
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
			entityId: null,
			cardId: cardId,
			cardName: this.i18n.getCardName(cardId, refCard.name),
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);
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
