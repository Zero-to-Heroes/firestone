/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	CardIds,
	CardType,
	GameFormat,
	GameTag,
	GameType,
	hasCorrectTribe,
	hasMechanic,
	Race,
} from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { animalCompanionTokenCardIds } from '../../services/card-highlight/selectors';
import { filterCards } from '../../services/cards/utils';
import { getTagWithHistory } from '../../services/parser-entity-utils';
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
	isPlayer: boolean;
}> {
	public override id: CounterType = 'animalCompanionAura';
	public override image = CardIds.TamePet_MEND_300;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerAnimalCompanionAuraCounter' as const,
		display: (state: GameState): boolean =>
			!!state.playerDeck.animalCompanionBufferEntityId ||
			state.playerDeck.hasRelevantCard(animalCompanionBuffsCardIds),
		value: (state: GameState) => {
			const bufferEntity = state.parserState?.CurrentEntities.get(
				state.playerDeck.animalCompanionBufferEntityId!,
			);

			const newAnimalCompanions = [
				getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_4),
				getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_5),
				getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_6),
			].filter((c) => !!c);
			if (newAnimalCompanions.length === 0) {
				return null;
			}
			const newCost = this.allCards.getCard(newAnimalCompanions[0]!).cost ?? 3;
			return {
				cost: newCost,
				cardIds: newAnimalCompanions.map((c) => this.allCards.getCard(c!).id as CardIds),
				isPlayer: true,
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
			state.opponentDeck.animalCompanionBuffAmount > 0 ||
			state.opponentDeck.hasRelevantCard(animalCompanionBuffsCardIds),
		value: (state: GameState) => {
			const newCost = Math.min(10, state.opponentDeck.animalCompanionBuffAmount + 3);
			const cardIds = filterCards(
				CardIds.AnimalCompanionCore,
				this.allCards.getService(),
				(c) =>
					c.cost === newCost &&
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.BEAST) &&
					!hasMechanic(c, GameTag.COLOSSAL),
				{
					format: state.metadata?.formatType ?? GameFormat.FT_STANDARD,
					gameType: state.metadata?.gameType ?? GameType.GT_RANKED,
					scenarioId: state.metadata?.scenarioId ?? 0,
					validArenaPool: this.curatedPools?.arena ?? [],
					currentClass: state.opponentDeck.getCurrentClass()!,
					initialDecklist: state.opponentDeck.deckList?.map((c) => c.cardId) ?? undefined,
				},
			);
			return {
				cost: newCost,
				cardIds: cardIds as readonly CardIds[],
				isPlayer: false,
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
		const value = this[side]!.value(gameState)?.cost ?? 3;
		return this.i18n.translateString(`counters.animal-companion-aura.${side}`, { value });
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { cost: number; cardIds: readonly CardIds[]; isPlayer: boolean } | null | undefined,
	): readonly string[] | undefined {
		return value?.cardIds?.length ? value.cardIds : animalCompanionTokenCardIds;
	}
}
