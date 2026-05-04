/* eslint-disable @typescript-eslint/member-ordering */
import { CardClass, CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { HeroCard } from '../../models/hero-card';
import { getControllerEntity, getEntityTag } from '../../services/parser-entity-utils';
import { EXTENDED_STARSHIP_CARDS } from './extended-starship-cards';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export { EXTENDED_STARSHIP_CARDS } from './extended-starship-cards';

const STARSHIP_COST_REDUCTION_CARDS = [
	CardIds.SalvageTheBunker_SC_404,
	CardIds.Scv_SC_401,
	CardIds.LockOn_SC_407,
	CardIds.ConcussiveShells_SC_411,
];

export class NextStarshipLaunchCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'nextStarshipLaunch';
	public override image = (gameState: GameState) => getStarshipForHero(gameState.playerDeck?.hero);
	public override cards: readonly CardIds[] = [];

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
		value: (state: GameState): number | null => {
			const controllerEntity = getControllerEntity(state.parserState?.CurrentEntities, state.parserState?.ControllerEntityMap, state.localPlayerId!);
			return getEntityTag(controllerEntity, GameTag.STARSHIP_LAUNCH_COST_DISCOUNT, 0) || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.next-starship-launch-tooltip'),
		},
	};

	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
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
