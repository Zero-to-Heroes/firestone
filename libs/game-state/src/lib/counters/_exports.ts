import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CounterDefinitionV2 } from './_counter-definition-v2';
import { BallerBuffCounterDefinitionV2 } from './impl/battlegrounds/baller-buff';
import { BeetlesBuffCounterDefinitionV2 } from './impl/battlegrounds/beetles-buff';
import { FreeRefreshCounterDefinitionV2 } from './impl/battlegrounds/free-refresh';
import { GoldNextTurnCounterDefinitionV2 } from './impl/battlegrounds/gold-next-turn';
import { MagnetizedCounterDefinitionV2 } from './impl/battlegrounds/magnetized';
import { SpellsPlayedCounterDefinitionV2 } from './impl/battlegrounds/spells-played';
import { CardsDrawnCounterDefinitionV2 } from './impl/cards-drawn';
import { GiftsPlayedCounterDefinitionV2 } from './impl/cards-played-not-in-starting-deck';
import { CardsPlayedThisTurnCounterDefinitionV2 } from './impl/cards-played-this-turn';
import { CeaselessExpanseCounterDefinitionV2 } from './impl/ceaseless-expanse';
import { ComboCardsPlayedCounterDefinitionV2 } from './impl/combo-cards-played';
import { DamageTakenOnYourTurnCounterDefinitionV2 } from './impl/damage-taken-on-your-turn';
import { DiscoversCounterDefinitionV2 } from './impl/discovers';
import { DragonsPlayedCounterDefinitionV2 } from './impl/dragons-played';
import { DragonsSummonedCounterDefinitionV2 } from './impl/dragons-summoned';
import { LibramReductionCounterDefinitionV2 } from './impl/libram-reduction';
import { MinionsDeadThisGameCounterDefinitionV2 } from './impl/minions-dead-this-game';
import { NextStarshipLaunchCounterDefinitionV2 } from './impl/next-starship-launch';
import { ProtossMinionReductionCounterDefinitionV2 } from './impl/protoss-minion-reduction';
import { ProtossSpellsCounterDefinitionV2 } from './impl/protoss-spells';
import { SpellCastOnFriendlyCharacterCounterDefinitionV2 } from './impl/spell-cast-on-friendly-character';

export const getAllCounters: (
	i18n: ILocalizationService,
	allCards: CardsFacadeService,
) => readonly CounterDefinitionV2<any>[] = (i18n: ILocalizationService, allCards: CardsFacadeService) => [
	new DragonsSummonedCounterDefinitionV2(i18n),
	new DragonsPlayedCounterDefinitionV2(i18n, allCards),
	new CeaselessExpanseCounterDefinitionV2(i18n),
	new DiscoversCounterDefinitionV2(i18n),
	new LibramReductionCounterDefinitionV2(i18n),
	new CardsDrawnCounterDefinitionV2(i18n),
	new SpellCastOnFriendlyCharacterCounterDefinitionV2(i18n),
	new GiftsPlayedCounterDefinitionV2(i18n),
	new ComboCardsPlayedCounterDefinitionV2(i18n, allCards),
	new DamageTakenOnYourTurnCounterDefinitionV2(i18n),
	new ProtossMinionReductionCounterDefinitionV2(i18n),
	new ProtossSpellsCounterDefinitionV2(i18n, allCards),
	new NextStarshipLaunchCounterDefinitionV2(i18n, allCards),
	new CardsPlayedThisTurnCounterDefinitionV2(i18n, allCards),
	new MinionsDeadThisGameCounterDefinitionV2(i18n),
	// BG
	new BeetlesBuffCounterDefinitionV2(i18n),
	new BallerBuffCounterDefinitionV2(i18n),
	new MagnetizedCounterDefinitionV2(i18n),
	new FreeRefreshCounterDefinitionV2(i18n),
	new SpellsPlayedCounterDefinitionV2(i18n),
	new GoldNextTurnCounterDefinitionV2(i18n, allCards),
];

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| 'galakrond'
	| 'cardsPlayedThisTurn'
	| 'nextStarshipLaunch'
	| 'protossMinionReduction'
	| 'protossSpells'
	| 'spellsOnFriendly'
	| 'pogo'
	| 'giftsPlayed'
	| 'freeRefresh'
	| 'ceaselessExpanse'
	| 'discovers'
	| 'astralAutomaton'
	| 'chainedGuardian'
	| 'earthenGolem'
	| 'comboCardsPlayed'
	| 'treant'
	| 'dragonsSummoned'
	| 'dragonsPlayed'
	| 'piratesSummoned'
	| 'attack'
	| 'jadeGolem'
	| 'cthun'
	| 'fatigue'
	| 'abyssalCurse'
	| 'spells'
	| 'elemental'
	| 'watchpost'
	| 'libram'
	| 'libramReduction'
	| 'bolner'
	| 'brilliantMacaw'
	| 'monstrousParrot'
	| 'vanessaVanCleef'
	| 'deadMinionsThisGame'
	| 'damageTakenOnYourTurn'
	| 'seaShanty'
	| 'locationsUsed'
	| 'wheelOfDeath'
	| 'thirstyDrifter'
	| 'cardsPlayedFromAnotherClass'
	| 'cardsDrawn'
	| 'elementalStreak'
	| 'tramHeist'
	| 'excavate'
	| 'chaoticTendril'
	| 'secretsPlayed'
	| 'lightray'
	| 'holySpells'
	| 'menagerie'
	| 'corpseSpent'
	| 'overdraft'
	| 'asvedon'
	| 'murozondTheInfinite'
	| 'nagaGiant'
	| 'gardensGrace'
	| 'anachronos'
	| 'bonelordFrostwhisper'
	| 'parrotMascot'
	| 'queensguard'
	| 'spectralPillager'
	| 'ladyDarkvein'
	| 'greySageParrot'
	| 'heroPowerDamage'
	| 'shockspitter'
	| 'multicaster'
	| 'si7Counter'
	| 'elwynnBoar'
	| 'volatileSkeleton'
	| 'relic'
	| 'beetlesBuff'
	| 'bgsPogo'
	| 'bgsSouthsea'
	| 'bgsMagmaloc'
	| 'bgsBloodGem'
	| 'bgsGoldDelta'
	| 'bgsLordOfGains'
	| 'bgsTuskarrRaider'
	| 'bgsMagnetized'
	| 'bgsSpellsPlayed'
	| 'ballerBuff'
	| 'bgsMajordomo';
