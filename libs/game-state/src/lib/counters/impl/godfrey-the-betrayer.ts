/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class GodfreyTheBetrayerCounterDefinitionV2 extends CounterDefinitionV2<
	readonly { cardId: string; returned: boolean }[]
> {
	public override id: CounterType = 'godfreyTheBetrayer';
	public override image = CardIds.GodfreytheBetrayer_JAIL_509;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	protected override advancedTooltipType = 'CheckOffCardsListComponent';

	readonly player = {
		pref: 'playerGodfreyTheBetrayerCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.globalEffects.some((c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509),
		value: (state: GameState) => {
			const allBurned = state.playerDeck.burnedCards;
			const returnedCards = state.playerDeck
				.getAllCardsInDeckWithoutOptions()
				.filter((c) => c.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e);
			const originalReturnedEntityIds = returnedCards.map(
				(r) =>
					state.parserState?.CurrentEntities?.get(r.entityId)?.Tags?.find(
						(t) => t.Name === GameTag.COPIED_FROM_ENTITY_ID,
					)?.Value,
			);
			const result: { cardId: string; returned: boolean }[] = allBurned.map((c) => {
				const result = {
					cardId: c.cardId,
					returned: originalReturnedEntityIds.includes(c.entityId),
				};
				return result;
			});

			return result;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.godfrey-the-betrayer-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.godfrey-the-betrayer-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentGodfreyTheBetrayerCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.globalEffects.some((c) => c.cardId === CardIds.GodfreytheBetrayer_JAIL_509),
		value: (state: GameState) => {
			const allBurned = state.opponentDeck.burnedCards;
			const returnedCards = state.opponentDeck
				.getAllCardsInDeckWithoutOptions()
				.filter((c) => c.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e);
			const originalReturnedEntityIds = returnedCards.map(
				(r) =>
					state.parserState?.CurrentEntities?.get(r.entityId)?.Tags?.find(
						(t) => t.Name === GameTag.COPIED_FROM_ENTITY_ID,
					)?.Value,
			);
			const result: { cardId: string; returned: boolean }[] = allBurned.map((c) => {
				const result = {
					cardId: c.cardId,
					returned: originalReturnedEntityIds.includes(c.entityId),
				};
				return result;
			});

			return result;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.godfrey-the-betrayer-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.godfrey-the-betrayer-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override formatValue(
		value: readonly { cardId: string; returned: boolean }[] | null | undefined,
	): null | undefined | number | string {
		return value?.filter((c) => !c.returned).length ?? 0;
	}

	protected override advancedTooltipInput(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: readonly { cardId: string; returned: boolean }[] | null | undefined,
	): any {
		const config: any /*CheckOffCardsListConfig*/ = {
			title: this.i18n.translateString('counters.godfrey-the-betrayer.title'),
			text: this.i18n.translateString(`counters.godfrey-the-betrayer.${side}`, {
				value: value?.filter((c) => !c.returned).length ?? 0,
			}),
			cards:
				value?.map((c) => {
					return {
						cardId: c.cardId,
						checked: c.returned,
						quantity: 1,
					};
				}) ?? [],
		};
		return config;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		return null;
	}
}
