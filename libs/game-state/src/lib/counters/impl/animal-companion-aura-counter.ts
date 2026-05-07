/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { FullEntity } from '@firestone/power-log-parser';
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
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_4),
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_5),
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_6),
			].filter((c) => !!c);
			console.debug('[debug] animal companion aura counter', bufferEntity, newAnimalCompanions);
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
			!!state.opponentDeck.animalCompanionBufferEntityId ||
			state.opponentDeck.hasRelevantCard(animalCompanionBuffsCardIds),
		value: (state: GameState) => {
			const bufferEntity = state.parserState?.CurrentEntities.get(
				state.opponentDeck.animalCompanionBufferEntityId!,
			);
			const newAnimalCompanions = [
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_4),
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_5),
				getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_6),
			].filter((c) => !!c);
			if (newAnimalCompanions.length === 0) {
				return null;
			}
			const newCost = this.allCards.getCard(newAnimalCompanions[0]!).cost ?? 3;
			return {
				cost: newCost,
				cardIds: newAnimalCompanions.map((c) => this.allCards.getCard(c!).id as CardIds),
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
		const value = this[side]!.value(gameState)?.cost ?? 0;
		return this.i18n.translateString(`counters.animal-companion-aura.${side}`, { value });
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { cost: number; cardIds: readonly CardIds[]; isPlayer: boolean } | null | undefined,
	): readonly string[] | undefined {
		if (!value?.isPlayer) {
			return undefined;
		}
		return value?.cardIds?.length ? value.cardIds : animalCompanionTokenCardIds;
	}
}

const getTagWithHistory = (entity: FullEntity | undefined | null, tag: GameTag | number): number | null => {
	if (!entity) {
		return null;
	}

	const result = entity.Tags?.find((t) => t.Name === tag)?.Value;
	if (!!result) {
		return result;
	}

	// Can happen if the entity got transformed, then we look into the past
	// Pick the last one
	const history = entity.TagsHistory.filter((t) => t.Name === tag).pop()?.Value;
	return history ?? null;
};
