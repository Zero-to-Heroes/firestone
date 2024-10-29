import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CounterDefinitionV2 } from './_counter-definition-v2';
import { CeaselessExpanseCounterDefinitionV2 } from './impl/ceaseless-expense';
import { DragonsPlayedCounterDefinitionV2 } from './impl/dragons-played';
import { DragonsSummonedCounterDefinitionV2 } from './impl/dragons-summoned';

export const allCounters: (
	i18n: ILocalizationService,
	allCards: CardsFacadeService,
) => readonly CounterDefinitionV2<any>[] = (i18n: ILocalizationService, allCards: CardsFacadeService) => [
	new DragonsSummonedCounterDefinitionV2(i18n),
	new DragonsPlayedCounterDefinitionV2(i18n, allCards),
	new CeaselessExpanseCounterDefinitionV2(i18n),
];

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| 'galakrond'
	| 'pogo'
	| 'ceaselessExpanse'
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
	| 'bgsPogo'
	| 'bgsSouthsea'
	| 'bgsMagmaloc'
	| 'bgsBloodGem'
	| 'bgsGoldDelta'
	| 'bgsLordOfGains'
	| 'bgsTuskarrRaider'
	| 'bgsMajordomo';
