import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

const PROCESSORS = [
	{
		cardSelector: (card: ReferenceCard) => [CardIds.AstralAutomaton].includes(card?.id as CardIds),
		updater: (deck: DeckState): DeckState =>
			deck.update({ astralAutomatonsSummoned: (deck.astralAutomatonsSummoned ?? 0) + 1 }),
	},
	{
		cardSelector: (card: ReferenceCard) => [CardIds.StoneheartKing_EarthenGolemToken].includes(card?.id as CardIds),
		updater: (deck: DeckState): DeckState =>
			deck.update({ earthenGolemsSummoned: (deck.earthenGolemsSummoned ?? 0) + 1 }),
	},
	{
		cardSelector: (card: ReferenceCard) => card?.isTreant,
		updater: (deck: DeckState): DeckState => deck.update({ treantsSummoned: (deck.treantsSummoned ?? 0) + 1 }),
	},
	{
		cardSelector: (card: ReferenceCard) =>
			card?.races?.includes(Race[Race.DRAGON]) || card?.races?.includes(Race[Race.ALL]),
		updater: (deck: DeckState): DeckState => deck.update({ dragonsSummoned: (deck.dragonsSummoned ?? 0) + 1 }),
	},
	{
		cardSelector: (card: ReferenceCard) =>
			card?.races?.includes(Race[Race.PIRATE]) || card?.races?.includes(Race[Race.ALL]),
		updater: (deck: DeckState): DeckState => deck.update({ piratesSummoned: (deck.piratesSummoned ?? 0) + 1 }),
	},
];
export class SpecificSummonsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const refCard = this.allCards.getCard(gameEvent.cardId);
		const processors = PROCESSORS.filter((p) => p.cardSelector(refCard));
		// console.debug('processor', gameEvent.type, gameEvent, processors);
		if (!processors?.length) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		let newPlayerDeck = deck;
		for (const processor of processors) {
			newPlayerDeck = processor.updater(newPlayerDeck);
		}
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SPECIFIC_SUMMONS';
	}
}
