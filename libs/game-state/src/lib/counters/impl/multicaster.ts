/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class MulticasterCounterDefinitionV2 extends CounterDefinitionV2<readonly string[]> {
	public override id: CounterType = 'multicaster';
	public override image = CardIds.DiscoveryOfMagic;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.Multicaster,
		CardIds.CoralKeeper,
		CardIds.WisdomOfNorgannon,
		CardIds.Sif,
		CardIds.InquisitiveCreation,
		CardIds.DiscoveryOfMagic,
		CardIds.ElementalInspiration,
		CardIds.MagisterDawngrasp_AV_200,
		CardIds.RazzleDazzler_VAC_301,
		CardIds.SirenSong_VAC_308,
	];

	readonly player = {
		pref: 'playerMulticasterCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.uniqueSpellSchools;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.multicaster-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.multicaster-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentMulticasterCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck?.spellsPlayedThisMatch?.length > 0 &&
			initialHeroClassIs(state.opponentDeck.hero, [CardClass.MAGE, CardClass.SHAMAN, CardClass.DEATHKNIGHT]),
		value: (state: GameState) => {
			return state.opponentDeck.uniqueSpellSchools;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.multicaster-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.multicaster-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(value: readonly string[] | null | undefined): null | undefined | number | string {
		return value?.length ?? 0;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string {
		const uniqueSpellSchools = this[side]?.value(gameState);
		const totalCardsToDraw = uniqueSpellSchools?.length || 0;
		const allSchools = uniqueSpellSchools
			?.map((spellSchool) => this.i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
			.sort();
		const schoolsText = countersUseExpandedView ? '<br/>' + allSchools?.join('<br/>') : allSchools?.join(', ');
		const tooltip = !!uniqueSpellSchools?.length
			? this.i18n.translateString(`counters.multicaster.${side}-new`, {
					cardsTotal: totalCardsToDraw,
					schools: schoolsText,
			  })
			: this.i18n.translateString(`counters.multicaster.${side}`, { schools: 0 });
		return tooltip;
	}
}
