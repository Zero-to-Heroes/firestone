/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SpellsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'spells';
	public override image = CardIds.YoggSaronHopesEnd_OG_134;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.YoggSaronHopesEnd_OG_134,
		CardIds.YoggSaronMasterOfFate,
		CardIds.ArcaneGiant,
		CardIds.MeddlesomeServant_YOG_518,
		CardIds.ContaminatedLasher_YOG_528,
		CardIds.SaroniteShambler_YOG_521,
		CardIds.PrisonBreaker_YOG_411,
		CardIds.GraveHorror,
		CardIds.UmbralOwl,
		CardIds.UmbralOwl_CORE_DMF_060,
	];

	readonly player = {
		pref: 'playerSpellCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.spellsPlayedThisMatch?.length ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentSpellCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.spellsPlayedThisMatch?.length ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.number-of-spells-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side].value(gameState)!;
		return this.i18n.translateString(`counters.spell.${side}`, { value: value });
	}
}
