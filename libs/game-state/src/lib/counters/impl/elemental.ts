/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ElementalCounterDefinitionV2 extends CounterDefinitionV2<{
	elementalsPlayedThisTurn: number;
	elementalsPlayedLastTurn: number;
}> {
	public override id: CounterType = 'elemental';
	public override image = CardIds.GrandFinale;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.GrandFinale,
		CardIds.Ozruk,
		CardIds.UnchainedGladiator,
		// "If you played an Elemental last turn" / Kindred cards
		CardIds.AnimatedAvalanche,
		CardIds.Arcanosaur,
		CardIds.AridStormer,
		CardIds.Blazecaller,
		CardIds.BonfireElemental,
		CardIds.ConjuredBookkeeper_TLC_226,
		CardIds.ElementaryReaction,
		CardIds.ErodedSediment_WW_428,
		CardIds.Firegill_DINO_404,
		CardIds.FrostfinChomper,
		CardIds.Gyreworm,
		CardIds.KalimosPrimalLord,
		CardIds.KalimosPrimalLord_Core_UNG_211,
		CardIds.Lamplighter_VAC_442,
		CardIds.LilypadLurker,
		CardIds.LivingPrairie_WW_024,
		CardIds.MinecartCruiser_WW_326,
		CardIds.Scorch,
		CardIds.ServantOfKalimos_UNG_816,
		CardIds.ShaleSpider_DEEP_034,
		CardIds.Slagclaw_TLC_482,
		CardIds.SpontaneousCombustion_GDB_456,
		CardIds.SteamSurger,
		CardIds.StoneSentinel,
		CardIds.TaintedRemnant_YOG_519,
		CardIds.ThunderLizard,
		CardIds.TolvirStoneshaper,
		CardIds.VolcanicThrasher_TLC_223,
	];

	readonly player = {
		pref: 'playerElementalCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return {
				elementalsPlayedThisTurn: state.playerDeck.elementalsPlayedThisTurn ?? 0,
				elementalsPlayedLastTurn: state.playerDeck.elementalsPlayedLastTurn ?? 0,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.elementals-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.elementals-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: { elementalsPlayedThisTurn: number; elementalsPlayedLastTurn: number } | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		return `${value.elementalsPlayedLastTurn}/${value.elementalsPlayedThisTurn}`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.elemental.${side}`, {
			lastTurn: value?.elementalsPlayedLastTurn,
			thisTurn: value?.elementalsPlayedThisTurn,
		});
	}
}
