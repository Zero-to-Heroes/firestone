import { CardIds, Race } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '@models/decktracker/game-state';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BgsMajordomoCounterDefinition
	implements CounterDefinition<{ deckState: GameState; bgState: BattlegroundsState }, readonly DeckCard[]>
{
	readonly type = 'bgsMajordomo';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): BgsMajordomoCounterDefinition {
		return new BgsMajordomoCounterDefinition(side, allCards, i18n);
	}

	public select(input: { deckState: GameState; bgState: BattlegroundsState }): readonly DeckCard[] {
		const deck = this.side === 'player' ? input.deckState.playerDeck : input.deckState.opponentDeck;
		return deck.cardsPlayedThisTurn ?? [];
	}

	public emit(cardsPlayedThisTurn: readonly DeckCard[]): NonFunctionProperties<BgsMajordomoCounterDefinition> {
		const value = cardsPlayedThisTurn
			.flatMap((card) => this.allCards.getCard(card.cardId).races ?? [])
			.filter((race) =>
				[Race.ELEMENTAL, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
			).length;
		return {
			type: 'bgsMajordomo',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MajordomoExecutus_BGS_105}.jpg`,
			cssClass: 'majordomo-counter',
			tooltip: this.i18n.translateString(`counters.bgs-majordomo.${this.side}`, { value: value }),
			standardCounter: true,
		};
	}
}
