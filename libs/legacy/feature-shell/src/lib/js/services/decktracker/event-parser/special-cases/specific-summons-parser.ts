import { CardIds } from '@firestone-hs/reference-data';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

const PROCESSORS = [
	{
		cardIds: [CardIds.AstralAutomaton],
		updater: (deck: DeckState): DeckState =>
			deck.update({ astralAutomatonsSummoned: (deck.astralAutomatonsSummoned ?? 0) + 1 }),
	},
	{
		cardIds: [CardIds.StoneheartKing_EarthenGolemToken],
		updater: (deck: DeckState): DeckState =>
			deck.update({ earthenGolemsSummoned: (deck.earthenGolemsSummoned ?? 0) + 1 }),
	},
	{
		cardIds: [
			CardIds.PoisonTreantToken,
			CardIds.Treenforcements_TreantToken,
			CardIds.Move_AngryTreantToken,
			CardIds.PlotOfSin_TreantToken,
			CardIds.SowTheSoil_TreantToken,
			CardIds.GardenGnome_TreantToken,
			CardIds.PoisonSeeds_TreantToken,
			CardIds.FaireArborist_TreantToken,
			CardIds.TheForestsAid_TreantToken,
			CardIds.LivingMana_ManaTreantToken,
			CardIds.WitchwoodApple_TreantToken,
			CardIds.ForestSeedlings_TreantToken,
		],
		updater: (deck: DeckState): DeckState => deck.update({ treantsSummoned: (deck.treantsSummoned ?? 0) + 1 }),
	},
];
const CARD_IDS = PROCESSORS.flatMap((p) => p.cardIds);

export class SpecificSummonsParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			[GameEvent.CARD_PLAYED, GameEvent.MINION_SUMMONED, GameEvent.MINION_SUMMONED_FROM_HAND].includes(
				gameEvent.type,
			) &&
			CARD_IDS.includes(gameEvent.cardId as CardIds)
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const processor = PROCESSORS.find((p) => p.cardIds.includes(gameEvent.cardId as CardIds));
		const newPlayerDeck = processor.updater(deck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return 'SPECIFIC_SUMMONS';
	}
}
