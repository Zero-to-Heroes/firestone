import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../../../../models/decktracker/deck-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export const TREANT_CARD_IDS = [
	CardIds.PoisonTreantToken,
	CardIds.Treenforcements_TreantToken,
	CardIds.Move_AngryTreantToken,
	CardIds.PlotOfSin_TreantToken,
	CardIds.DrumCircle_TreantToken,
	CardIds.SowTheSoil_TreantToken,
	CardIds.GardenGnome_TreantToken,
	CardIds.PoisonSeeds_TreantToken,
	CardIds.FaireArborist_TreantToken,
	CardIds.TheForestsAid_TreantToken,
	CardIds.LivingMana_ManaTreantToken,
	CardIds.WitchwoodApple_TreantToken,
	CardIds.ForestSeedlings_TreantToken,
	CardIds.TreantLegacy,
	CardIds.TreantVanilla,
	CardIds.Treant_TreantVanilla,
	CardIds.BloodTreant,
	CardIds.Cenarius_TreantLegacyToken,
	CardIds.RunicCarvings_TreantTotemToken,
	CardIds.SoulOfTheForest_TreantLegacyToken,
];

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
		cardSelector: (card: ReferenceCard) => TREANT_CARD_IDS.includes(card?.id as CardIds),
		updater: (deck: DeckState): DeckState => deck.update({ treantsSummoned: (deck.treantsSummoned ?? 0) + 1 }),
	},
	{
		cardSelector: (card: ReferenceCard) =>
			card?.races?.includes(Race[Race.DRAGON]) || card?.races?.includes(Race[Race.ALL]),
		updater: (deck: DeckState): DeckState => deck.update({ dragonsSummoned: (deck.dragonsSummoned ?? 0) + 1 }),
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
		console.debug('processor', gameEvent.type, gameEvent, processors);
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
