import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class SecretsPlayedCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'secretsPlayed';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): SecretsPlayedCounterDefinition {
		return new SecretsPlayedCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		return gameState.cardsPlayedThisMatch
			.filter((c) => c.side === this.side)
			.filter((c) => this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.SECRET]));
	}

	public emit(secretsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<SecretsPlayedCounterDefinition> {
		return {
			type: 'secretsPlayed',
			value: secretsPlayedThisMatch.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.KabalCrystalRunner}.jpg`,
			cssClass: 'secret-counter',
			tooltip: this.i18n.translateString(`counters.secrets.${this.side}`, {
				value: secretsPlayedThisMatch.length,
			}),
			standardCounter: true,
		};
	}
}
