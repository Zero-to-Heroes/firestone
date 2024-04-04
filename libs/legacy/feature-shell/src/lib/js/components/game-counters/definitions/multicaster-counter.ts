import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, distinctUntilChanged, map } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MulticasterCounterDefinition implements CounterDefinition<GameState, readonly string[], boolean> {
	prefValue$?: Observable<boolean> = new Observable<boolean>();

	readonly type = 'multicaster';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static async create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
		prefs: PreferencesService,
	): Promise<MulticasterCounterDefinition> {
		await prefs.isReady();
		const result = new MulticasterCounterDefinition(side, allCards, i18n);
		result.prefValue$ = prefs.preferences$$.pipe(
			map((prefs) => prefs.countersUseExpandedView),
			distinctUntilChanged(),
		);
		return result;
	}

	public select(gameState: GameState): readonly string[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.uniqueSpellSchools ?? [];
	}

	public emit(
		uniqueSpellSchools: readonly string[],
		countersUseExpandedView: boolean,
	): NonFunctionProperties<MulticasterCounterDefinition> {
		const totalCardsToDraw = uniqueSpellSchools?.length || 0;
		const allSchools = uniqueSpellSchools
			?.map((spellSchool) => this.i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
			.sort();
		const schoolsText = countersUseExpandedView ? '<br/>' + allSchools?.join('<br/>') : allSchools?.join(', ');
		const tooltip = !!uniqueSpellSchools?.length
			? this.i18n.translateString(`counters.multicaster.${this.side}-new`, {
					cardsTotal: totalCardsToDraw,
					schools: schoolsText,
			  })
			: this.i18n.translateString(`counters.multicaster.${this.side}`, { schools: 0 });
		return {
			type: 'multicaster',
			value: `${totalCardsToDraw}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.DiscoveryOfMagic}.jpg`,
			cssClass: 'spell-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
