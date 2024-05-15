import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class HolySpellsCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'holySpells';
	readonly value: number | string;
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
	): HolySpellsCounterDefinition {
		return new HolySpellsCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisMatch;
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<HolySpellsCounterDefinition> {
		const holySpellsPlayed = cardsPlayedThisMatch
			.map((c) => this.allCards.getCard(c.cardId))
			.filter((c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.SPELL])
			.filter((c: ReferenceCard) => c?.spellSchool.includes(SpellSchool[SpellSchool.HOLY])).length;
		const tooltip = this.i18n.translateString(`counters.holy-spells.${this.side}`, {
			value: holySpellsPlayed,
		});
		return {
			type: 'holySpells',
			value: holySpellsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.FlickeringLightbot_MIS_918}.jpg`,
			cssClass: 'holy-spells-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
