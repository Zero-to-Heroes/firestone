import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '@legacy-import/src/lib/js/models/decktracker/deck-card';
import { DeckManipulationHelper } from '@legacy-import/src/lib/js/services/decktracker/event-parser/deck-manipulation-helper';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class DeathrattleTriggeredParser implements EventParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly helper: DeckManipulationHelper,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		let newGlobalEffects = deck.globalEffects;
		let bonelordFrostwhisperFirstTurnTrigger = deck.bonelordFrostwhisperFirstTurnTrigger;
		if (cardId === CardIds.BonelordFrostwhisper) {
			const refCard = this.allCards.getCard(cardId);
			const card = DeckCard.create({
				entityId: null,
				cardId: cardId,
				cardName: this.i18n.getCardName(cardId, refCard.name),
				manaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: null,
			} as DeckCard);
			newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
			bonelordFrostwhisperFirstTurnTrigger =
				deck.bonelordFrostwhisperFirstTurnTrigger || currentState.gameTagTurnNumber;
			console.debug('global effects', bonelordFrostwhisperFirstTurnTrigger, newGlobalEffects, cardId);
		}
		const newPlayerDeck = deck.update({
			lastDeathrattleTriggered: cardId,
			bonelordFrostwhisperFirstTurnTrigger: bonelordFrostwhisperFirstTurnTrigger,
			globalEffects: newGlobalEffects,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.DEATHRATTLE_TRIGGERED;
	}
}
