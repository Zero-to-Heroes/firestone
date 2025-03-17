/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class SecretsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'secretsPlayed';
	public override image = CardIds.KabalCrystalRunner;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.KabalCrystalRunner,
		CardIds.KabalCrystalRunner_WON_308,
		CardIds.StalkingPrideTavernBrawlToken,
		CardIds.SrTombDiverTavernBrawl,
		CardIds.JrTombDiverTavernBrawl,
		CardIds.JrTombDiver,
		CardIds.SrTombDiver_ULDA_021,
	];

	readonly player = {
		pref: 'playerSecretsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.cardsPlayedThisMatch.filter((c) =>
					this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.SECRET]),
				).length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.secrets-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.secrets-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.secrets.${side}`, { value: value });
	}
}
