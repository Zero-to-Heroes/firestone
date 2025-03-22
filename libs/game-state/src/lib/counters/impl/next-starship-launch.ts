/* eslint-disable @typescript-eslint/member-ordering */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { HeroCard } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export const EXTENDED_STARSHIP_CARDS = [
	CardIds.Starport_SC_403,
	CardIds.StarshipSchematic_GDB_102,
	CardIds.ScroungingShipwright_GDB_876,
	CardIds.SalvageTheBunker_SC_404,
	CardIds.LiftOff_SC_410,
	CardIds.WaywardProbe_SC_500,
];

export class NextStarshipLaunchCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'nextStarshipLaunch';
	public override image = (gameState: GameState) => getStarshipForHero(gameState.playerDeck?.hero);
	public override cards: readonly CardIds[] = [
		CardIds.SalvageTheBunker_SC_404,
		CardIds.Scv_SC_401,
		CardIds.LockOn_SC_407,
		CardIds.ConcussiveShells_SC_411,
	];

	readonly player = {
		pref: 'playerProtossSpellsCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck?.getAllPotentialFutureCards().some((c) => {
				const mechanics = this.allCards.getCard(c.cardId)?.mechanics ?? [];
				return (
					EXTENDED_STARSHIP_CARDS.includes(c.cardId as CardIds) ||
					mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]) ||
					mechanics?.includes(GameTag[GameTag.STARSHIP])
				);
			}),
		value: (state: GameState): number | null =>
			state.fullGameState?.Player?.PlayerEntity?.tags?.find(
				(t) => t.Name === GameTag.STARSHIP_LAUNCH_COST_DISCOUNT,
			)?.Value || null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.next-starship-launch.${side}`, {
			value: this[side]?.value(gameState) ?? 0,
		});
	}
}

const getStarshipForHero = (hero: HeroCard | undefined): string => {
	const currentClass = hero?.classes?.[0];

	switch (currentClass) {
		case CardClass.DEATHKNIGHT:
			return CardIds.ArkoniteDefenseCrystal_TheSpiritsPassageToken_GDB_100t4;
		case CardClass.DEMONHUNTER:
			return CardIds.ArkoniteDefenseCrystal_TheLegionsBaneToken_GDB_100t5;
		case CardClass.DRUID:
			return CardIds.ArkoniteDefenseCrystal_TheCelestialArchiveToken_GDB_100t6;
		case CardClass.HUNTER:
			return CardIds.ArkoniteDefenseCrystal_TheAstralCompassToken_GDB_100t7;
		case CardClass.MAGE:
			return CardIds.ArkoniteDefenseCrystal_TheScavengersWillToken_GDB_100t8;
		case CardClass.WARLOCK:
			return CardIds.ArkoniteDefenseCrystal_TheNethersEyeToken_GDB_100t9;
		case CardClass.PALADIN:
		case CardClass.SHAMAN:
		case CardClass.WARRIOR:
			return CardIds.BattlecruiserToken_SC_999t;
		default:
			return CardIds.ArkoniteDefenseCrystal_TheExilesHopeToken_GDB_100t2;
	}
};
