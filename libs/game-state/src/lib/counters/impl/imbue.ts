/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

const cards = [CardIds.MalorneTheWaywatcher_EDR_888];

export class ImbueCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'imbue';
	public override image = (gameState: GameState, side: 'player' | 'opponent'): string => {
		const playerClass = gameState?.playerDeck?.hero?.classes?.[0];
		switch (playerClass) {
			case CardClass.DRUID:
				return CardIds.DreamboundDisciple_BlessingOfTheGolem_EDR_847p;
			case CardClass.HUNTER:
				return CardIds.BlessingOfTheWolf_EDR_850p;
			case CardClass.PRIEST:
				return CardIds.LunarwingMessenger_BlessingOfTheMoon_EDR_449p;
			case CardClass.MAGE:
				return CardIds.BlessingOfTheWisp_EDR_851p;
			case CardClass.PALADIN:
				return CardIds.BlessingOfTheDragon_EDR_445p;
			default:
				return CardIds.MalorneTheWaywatcher_EDR_888;
		}
	};
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerImbueCounter' as const,
		display: (state: GameState): boolean => {
			if (state.playerDeck.hasRelevantCard(cards)) {
				return true;
			}
			const value = this.player.value(state);
			if (!!value) {
				return true;
			}
			return false;
		},
		value: (state: GameState) => {
			return state.fullGameState?.Player?.PlayerEntity?.tags?.find((t) => t.Name === GameTag.IMBUES_THIS_GAME)
				?.Value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.imbue-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.imbue-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.imbue.${side}`, { value: value });
	}
}
