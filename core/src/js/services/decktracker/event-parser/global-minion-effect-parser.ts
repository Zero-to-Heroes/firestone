import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { globalEffectTriggersEffects } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class GlobalMinionEffectParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			gameEvent.type === GameEvent.SUB_SPELL_START &&
			globalEffectTriggersEffects.includes(gameEvent.additionalData?.prefabId)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: null,
			cardId: cardId,
			cardName: refCard?.name,
			manaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);
		const newGlobalEffects = this.helper.addSingleCardToZone(deck.globalEffects, card);
		const newPlayerDeck: DeckState = deck.update({
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
