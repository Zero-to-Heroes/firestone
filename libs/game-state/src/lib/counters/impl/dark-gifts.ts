import { CardClass, CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState, hasOrHadHeroClass } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { getEntitiesForPlayer, getEntityTag } from '../../services/parser-entity-utils';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DarkGiftsCounterDefinitionV2 extends CounterDefinitionV2<readonly string[]> {
	public override id: CounterType = 'darkGifts';
	public override image = CardIds.WallowTheWretched_EDR_487;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerDarkGiftsCounter' as const,
		display: (state: GameState): boolean => state.playerDeck?.hasRelevantCard([CardIds.WallowTheWretched_EDR_487]),
		value: (state: GameState): readonly string[] | null => {
			if (state.localPlayerId == null) return null;
			const entities = getEntitiesForPlayer(state.parserState?.CurrentEntities, state.localPlayerId)
				.filter(
					(e) =>
						getEntityTag(e, GameTag.IS_NIGHTMARE_BONUS) === 1 &&
						getEntityTag(e, GameTag.CARDTYPE) === CardType.SPELL,
				)
				.filter((e) => {
					const zone = getEntityTag(e, GameTag.ZONE);
					return zone !== (Zone.SETASIDE as number) && zone !== (Zone.REMOVEDFROMGAME as number);
				})
				.map((e) => e.CardId)
				// Unique - each dark gift is only applied once
				.filter((e, index, self) => self.indexOf(e) === index);
			return entities.length ? entities : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-tooltip', {
					cardName: allCards.getCard(CardIds.WallowTheWretched_EDR_487).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentDarkGiftsCounter' as const,
		display: (state: GameState): boolean => hasOrHadHeroClass(state.opponentDeck?.hero, [CardClass.WARLOCK]),
		value: (state: GameState): readonly string[] | null => {
			const candidates = state.opponentPlayerId != null
				? getEntitiesForPlayer(state.parserState?.CurrentEntities, state.opponentPlayerId)
					.filter((e) => getEntityTag(e, GameTag.IS_NIGHTMARE_BONUS) === 1)
				: [];
			const knownGifts = candidates
				// Once it has been revealed, it becomes an enchantment
				.filter((e) => getEntityTag(e, GameTag.CARDTYPE) === CardType.ENCHANTMENT)
				.filter((e) => {
					const zone = getEntityTag(e, GameTag.ZONE);
					// So that we only see the ones that are currently in play, or ones attacked to minions that died
					return zone === (Zone.PLAY as number) || zone === (Zone.REMOVEDFROMGAME as number);
				});
			const result =
				knownGifts
					.map((e) => {
						const baseEntity = getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_6);
						return baseEntity > 0 ? this.allCards.getCard(baseEntity).id : e.CardId;
					})
					// Unique - each dark gift is only applied once
					.filter((e, index, self) => self.indexOf(e) === index);
			return result?.length ? result : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-tooltip', {
					cardName: allCards.getCard(CardIds.WallowTheWretched_EDR_487).name,
				}),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(value: readonly string[] | null | undefined): string {
		return `${value?.length ?? 0}`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.dark-gifts.${side}`, {
			value: this[side]?.value(gameState)?.length ?? 0,
		});
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: readonly string[] | null | undefined,
	): readonly string[] | undefined {
		return value ?? undefined;
	}
}
