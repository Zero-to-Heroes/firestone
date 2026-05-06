/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { animalCompanionTokenCardIds } from '../../services/card-highlight/selectors';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

const animalCompanionBuffsCardIds: readonly CardIds[] = [
	CardIds.TamePet_MEND_300,
	CardIds.MigratingElekk_MEND_303,
	CardIds.RoamFree_MEND_307,
];

export class AnimalCompanionAuraCounterDefinitionV2 extends CounterDefinitionV2<{
	cost: number;
	cardIds: readonly CardIds[];
}> {
	public override id: CounterType = 'animalCompanionAura';
	public override image = CardIds.TamePet_MEND_300;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerAnimalCompanionAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.newAnimalCompanions.length > 0 ||
			state.playerDeck.hasRelevantCard(animalCompanionBuffsCardIds),
		value: (state: GameState) => {
			const newAnimalCompanions = state.playerDeck.newAnimalCompanions;
			const newCost = this.allCards.getCard(newAnimalCompanions[0]).cost ?? 3;
			return {
				cost: newCost,
				cardIds: newAnimalCompanions as readonly CardIds[],
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentAnimalCompanionAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.newAnimalCompanions.length > 0 ||
			state.opponentDeck.hasRelevantCard(animalCompanionBuffsCardIds),
		value: (state: GameState) => {
			const newAnimalCompanions = state.opponentDeck.newAnimalCompanions;
			const newCost = this.allCards.getCard(newAnimalCompanions[0]).cost ?? 3;
			return {
				cost: newCost,
				cardIds: newAnimalCompanions as readonly CardIds[],
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: { cost: number; cardIds: readonly CardIds[] } | null | undefined,
	): null | undefined | number | string {
		return value?.cost;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side]!.value(gameState)?.cost ?? 0;
		return this.i18n.translateString(`counters.animal-companion-aura.${side}`, { value });
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { cost: number; cardIds: readonly CardIds[] } | null | undefined,
	): readonly string[] | undefined {
		return value?.cardIds?.length ? value.cardIds : animalCompanionTokenCardIds;
	}
}
