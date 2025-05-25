import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

const reductionCards = [
	CardIds.Artanis_SC_754,
	CardIds.PhotonCannon_SC_753,
	CardIds.ConstructPylons_SC_755,
	CardIds.WarpGate_SC_751,
	CardIds.Sentry_SC_764,
];

export class ProtossMinionReductionCounterDefinitionV2 extends CounterDefinitionV2<string> {
	public override id: CounterType = 'protossMinionReduction';
	public override image = CardIds.Artanis_SC_754;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerProtossMinionReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): string | null => {
			const nextReductionCost =
				3 *
				state.playerDeck.enchantments.filter(
					(e) => e.cardId === CardIds.WarpGate_WarpConduitEnchantment_SC_751e,
				).length;
			const gameReductionCost = state.playerDeck.enchantments
				.filter((e) => e.cardId === CardIds.ConstructPylons_PsionicPowerEnchantment_SC_755e)
				.map((e) => (e.creatorCardId === CardIds.Artanis_SC_754 ? 2 : 1))
				.reduce((a, b) => a + b, 0);
			const showInfo =
				nextReductionCost > 0 || gameReductionCost > 0 || state.playerDeck.hasRelevantCard(reductionCards);
			return showInfo ? `${gameReductionCost} | ${nextReductionCost}` : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.protoss-minion-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.protoss-minion-reduction-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentProtossMinionReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): string | null => {
			const nextReductionCost =
				3 *
				state.opponentDeck.enchantments.filter(
					(e) => e.cardId === CardIds.WarpGate_WarpConduitEnchantment_SC_751e,
				).length;
			const gameReductionCost = state.opponentDeck.enchantments
				.filter((e) => e.cardId === CardIds.ConstructPylons_PsionicPowerEnchantment_SC_755e)
				.map((e) => (e.creatorCardId === CardIds.Artanis_SC_754 ? 2 : 1))
				.reduce((a, b) => a + b, 0);
			const showInfo =
				nextReductionCost > 0 || gameReductionCost > 0 || state.opponentDeck.hasRelevantCard(reductionCards);
			return showInfo ? `${gameReductionCost} | ${nextReductionCost}` : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.protoss-minion-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.protoss-minion-reduction-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const [game, next] = this[side]?.value(gameState)?.split('|') ?? [];
		return this.i18n.translateString(`counters.protoss-minion-reduction.${side}`, {
			game: game.trim(),
			next: next.trim(),
		});
	}
}
