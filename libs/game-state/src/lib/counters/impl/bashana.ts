/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, CardType, GameTag, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { filterCards, hasCorrectSpellSchool, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

const maxMana = 12;

export class BashanaCounterDefinitionV2 extends CounterDefinitionV2<{ treantsLeft: number; totalMana: number }> {
	public override id: CounterType = 'bashana';
	public override image = CardIds.BashanaRunetotem_MEND_046;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = undefined;
	readonly opponent = {
		pref: 'opponentBashanaCounter' as const,
		display: (state: GameState): boolean => {
			return state.opponentDeck.hand.some((c) => c.creatorCardId === CardIds.BashanaRunetotem_MEND_046);
		},
		value: (state: GameState) => {
			const latest = state.opponentDeck.hand
				.filter((c) => c.creatorCardId === CardIds.BashanaRunetotem_MEND_046)
				.shift();
			const bashanaEntityId = latest?.creatorEntityId;
			const treantEntityIds =
				state.parserState?.CurrentEntities != null
					? Array.from(state.parserState.CurrentEntities.values())
							.filter(
								(e) =>
									e.CardId === CardIds.BashanaRunetotem_TreantToken_MEND_046t &&
									e.GetTag(GameTag.CREATOR) === bashanaEntityId,
							)
							.map((e) => e.Entity)
					: [];
			const spells =
				state.parserState?.CurrentEntities != null
					? Array.from(state.parserState.CurrentEntities.values()).filter(
							(e) =>
								e.GetTag(GameTag.CARDTYPE) === CardType.SPELL &&
								treantEntityIds.includes(e.GetTag(GameTag.CREATOR)),
						)
					: [];
			const manaUsed = spells.reduce((acc, spell) => acc + spell.GetTag(GameTag.COST), 0);
			return {
				treantsLeft: state.opponentDeck.hand.filter(
					(c) =>
						c.creatorCardId === CardIds.BashanaRunetotem_MEND_046 && c.creatorEntityId === bashanaEntityId,
				).length,
				totalMana: Math.max(0, maxMana - manaUsed),
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.bashana-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.bashana-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: { treantsLeft: number; totalMana: number } | null | undefined,
	): readonly string[] | undefined {
		if (!value?.totalMana) {
			return undefined;
		}
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return filterCards(
			this.allCards.getService(),
			{
				currentClass: deckState.getCurrentClass(),
				format: gameState.metadata.formatType,
				gameType: gameState.metadata.gameType,
				scenarioId: gameState.metadata.scenarioId,
				validArenaPool: [],
			},
			CardIds.BashanaRunetotem_MEND_046,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCorrectSpellSchool(c, SpellSchool.NATURE) &&
				(value.treantsLeft === 1 ? hasCost(c, '==', value.totalMana) : hasCost(c, '<=', value.totalMana)),
		);
	}

	protected override formatValue(
		value: { treantsLeft: number; totalMana: number } | null | undefined,
	): null | undefined | number | string {
		if (!value?.totalMana) {
			return null;
		}
		return value.totalMana;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState)?.totalMana;
		return this.i18n.translateString(`counters.bashana.player`, { value: value });
	}
}
