/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { TurnDamage } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DamageTakenOnYourTurnCounterDefinitionV2 extends CounterDefinitionV2<readonly TurnDamage[]> {
	public override id: CounterType = 'damageTakenOnYourTurn';
	public override image = CardIds.PartyPlannerVona_VAC_945;
	public override cards: readonly CardIds[] = [CardIds.SaunaRegular_VAC_418, CardIds.PartyPlannerVona_VAC_945];

	readonly player = {
		pref: 'playerDamageTakenOnYourTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): readonly TurnDamage[] | null => {
			return state.playerDeck.damageTakenByTurn;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-taken-on-your-turn-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.damage-taken-on-your-turn-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(
		value: readonly TurnDamage[] | null | undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const totalDamageTakenOnYourTurns = value.flatMap((d) => d.damage).reduce((a, b) => a + b, 0);
		const numberOfTimesDamageTakenOnYourTurns = value.flatMap((d) => d.damage).length;
		return `${numberOfTimesDamageTakenOnYourTurns}/${totalDamageTakenOnYourTurns}`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const damageByTurn = side === 'player' ? this.player.value(gameState) : null;
		const totalDamageTakenOnYourTurns = damageByTurn!.flatMap((d) => d.damage).reduce((a, b) => a + b, 0);
		const numberOfTimesDamageTakenOnYourTurns = damageByTurn!.flatMap((d) => d.damage).length;
		const tooltip = this.i18n.translateString(`counters.damage-taken-on-your-turn.${side}`, {
			times: numberOfTimesDamageTakenOnYourTurns,
			damage: totalDamageTakenOnYourTurns,
		});
		return tooltip;
	}
}
