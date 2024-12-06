import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CounterDefinitionV2 } from './_counter-definition-v2';
import { BallerBuffCounterDefinitionV2 } from './impl/battlegrounds/baller-buff';
import { BeetlesBuffCounterDefinitionV2 } from './impl/battlegrounds/beetles-buff';
import { GoldNextTurnCounterDefinitionV2 } from './impl/battlegrounds/gold-next-turn';
import { MagnetizedCounterDefinitionV2 } from './impl/battlegrounds/magnetized';
import { CardsDrawnCounterDefinitionV2 } from './impl/cards-drawn';
import { CeaselessExpanseCounterDefinitionV2 } from './impl/ceaseless-expanse';
import { DiscoversCounterDefinitionV2 } from './impl/discovers';
import { DragonsPlayedCounterDefinitionV2 } from './impl/dragons-played';
import { DragonsSummonedCounterDefinitionV2 } from './impl/dragons-summoned';
import { LibramReductionCounterDefinitionV2 } from './impl/libram-reduction';
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
	// BG
	new BeetlesBuffCounterDefinitionV2(i18n),
	new BallerBuffCounterDefinitionV2(i18n),
	new MagnetizedCounterDefinitionV2(i18n),
	new GoldNextTurnCounterDefinitionV2(i18n, allCards),
];

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| 'galakrond'
	| 'spellsOnFriendly'
	| 'pogo'
	| 'ceaselessExpanse'
	| 'discovers'
	| 'astralAutomaton'
	| 'chainedGuardian'
	| 'earthenGolem'
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
	| 'ballerBuff'
	| 'bgsMajordomo';
