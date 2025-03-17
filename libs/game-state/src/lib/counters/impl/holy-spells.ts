/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, CardType, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class HolySpellsCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'holySpells';
	public override image = CardIds.FlickeringLightbot_MIS_918;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.FlickeringLightbot_MIS_918,
		CardIds.FlickeringLightbot_FlickeringLightbotToken_MIS_918t,
	];

	readonly player = {
		pref: 'playerHolySpellsCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.cardsPlayedThisMatch
					.map((c) => this.allCards.getCard(c.cardId))
					.filter((c: ReferenceCard) => c?.type?.toUpperCase() === CardType[CardType.SPELL])
					.filter((c: ReferenceCard) => c?.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.HOLY])
					.length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.holy-spells-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.holy-spells-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.holy-spells.${side}`, {
			value: value,
		});
	}
}
