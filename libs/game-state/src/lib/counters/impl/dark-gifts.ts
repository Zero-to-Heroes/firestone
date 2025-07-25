import { CardIds, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DarkGiftsCounterDefinitionV2 extends CounterDefinitionV2<readonly string[]> {
	public override id: CounterType = 'darkGifts';
	public override image = CardIds.WallowTheWretched_EDR_487;
	public override cards: readonly CardIds[] = [];
	protected override debug = true;

	readonly player = {
		pref: 'playerDarkGiftsCounter' as const,
		display: (state: GameState): boolean => state.playerDeck?.hasRelevantCard([CardIds.WallowTheWretched_EDR_487]),
		value: (state: GameState): readonly string[] | null =>
			state.fullGameState?.Player?.AllEntities?.filter(
				(e) => e.tags?.find((t) => t.Name === GameTag.IS_NIGHTMARE_BONUS)?.Value === 1,
			)
				.filter((e) => {
					const zone = e.tags.find((t) => t.Name === GameTag.ZONE)?.Value;
					return zone !== Zone.SETASIDE && zone !== Zone.REMOVEDFROMGAME;
				})
				.filter((e) => e.tags.find((t) => t.Name === GameTag.CARDTYPE)?.Value === CardType.SPELL)
				.map((e) => e.cardId)
				// Unique - each dark gift is only applied once
				.filter((e, index, self) => self.indexOf(e) === index) ?? null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gift-tooltip', {
					cardName: allCards.getCard(CardIds.WallowTheWretched_EDR_487).name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentDarkGiftsCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): readonly string[] | null =>
			state.fullGameState?.Opponent?.AllEntities?.filter(
				(e) => e.tags?.find((t) => t.Name === GameTag.IS_NIGHTMARE_BONUS)?.Value === 1,
			)
				.filter((e) => {
					const zone = e.tags.find((t) => t.Name === GameTag.ZONE)?.Value;
					return zone !== Zone.SETASIDE && zone !== Zone.REMOVEDFROMGAME;
				})
				.filter((e) => e.tags.find((t) => t.Name === GameTag.CARDTYPE)?.Value === CardType.SPELL)
				.map((e) => e.cardId)
				// Unique - each dark gift is only applied once
				.filter((e, index, self) => self.indexOf(e) === index) ?? null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gifts-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dark-gift-tooltip', {
					cardName: allCards.getCard(CardIds.WallowTheWretched_EDR_487).name,
				}),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
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
