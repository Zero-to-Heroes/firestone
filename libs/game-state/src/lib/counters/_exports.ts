import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CounterDefinitionV2 } from './_counter-definition-v2';
import { AbyssalCurseCounterDefinitionV2 } from './impl/abyssal-curse';
import { AnachronosCounterDefinitionV2 } from './impl/anachronos';
import { AstralAutomatonCounterDefinitionV2 } from './impl/astral-automaton';
import { AvianaElunesChoseCounterDefinitionV2 } from './impl/aviana-elunes-chosen';
import { BallerBuffCounterDefinitionV2 } from './impl/battlegrounds/baller-buff';
import { BeetlesBuffCounterDefinitionV2 } from './impl/battlegrounds/beetles-buff';
import { BgsBloodGemCounterDefinitionV2 } from './impl/battlegrounds/bgs-blood-gem';
import { BgsLordOfGainsCounterDefinitionV2 } from './impl/battlegrounds/bgs-lord-of-gains';
import { BgsMagmalocCounterDefinitionV2 } from './impl/battlegrounds/bgs-magmaloc';
import { BgsMajordomoCounterDefinitionV2 } from './impl/battlegrounds/bgs-majordomo';
import { BgsSouthseaStrongarmCounterDefinitionV2 } from './impl/battlegrounds/bgs-southsea-strongarm';
import { BgsTuskarrRaiderCounterDefinitionV2 } from './impl/battlegrounds/bgs-tuskarr-raider';
import { ElementalPowersBuffCounterDefinitionV2 } from './impl/battlegrounds/elemental-powers-buff';
import { ElementalTavernBuffCounterDefinitionV2 } from './impl/battlegrounds/elemental-tavern-buff';
import { FreeRefreshCounterDefinitionV2 } from './impl/battlegrounds/free-refresh';
import { GoldNextTurnCounterDefinitionV2 } from './impl/battlegrounds/gold-next-turn';
import { MagnetizedCounterDefinitionV2 } from './impl/battlegrounds/magnetized';
import { SpellsPlayedCounterDefinitionV2 } from './impl/battlegrounds/spells-played';
import { TavernSpellsBuffCounterDefinitionV2 } from './impl/battlegrounds/tavern-spells-buff';
import { BolnerHammerbeakCounterDefinitionV2 } from './impl/bolner-hammerbeak';
import { BonelordFrostwhisperCounterDefinitionV2 } from './impl/bonelord-frostwhisper';
import { CardsDrawnCounterDefinitionV2 } from './impl/cards-drawn';
import { CardsPlayedFromAnotherClassCounterDefinitionV2 } from './impl/cards-played-from-another-class';
import { GiftsPlayedCounterDefinitionV2 } from './impl/cards-played-not-in-starting-deck';
import { CardsPlayedThisTurnCounterDefinitionV2 } from './impl/cards-played-this-turn';
import { CardsShuffledIntoDeckCounterDefinitionV2 } from './impl/cards-shuffled-into-deck';
import { CeaselessExpanseCounterDefinitionV2 } from './impl/ceaseless-expanse';
import { ChainedGuardianCounterDefinitionV2 } from './impl/chained-guardian';
import { ChaoticTendrilCounterDefinitionV2 } from './impl/chaotic-tendril';
import { ComboCardsPlayedCounterDefinitionV2 } from './impl/combo-cards-played';
import { CorpseSpentCounterDefinitionV2 } from './impl/corpse-spent';
import { CthunCounterDefinitionV2 } from './impl/cthun';
import { DamageTakenOnYourTurnCounterDefinitionV2 } from './impl/damage-taken-on-your-turn';
import { DarkGiftsCounterDefinitionV2 } from './impl/dark-gifts';
import { DiscoversCounterDefinitionV2 } from './impl/discovers';
import { DiveTheGolakkaDepthsCounterDefinitionV2 } from './impl/dive-the-golakka-depths';
import { DragonsInHandCounterDefinitionV2 } from './impl/dragons-in-hand';
import { DragonsPlayedCounterDefinitionV2 } from './impl/dragons-played';
import { DragonsSummonedCounterDefinitionV2 } from './impl/dragons-summoned';
import { EarthenGolemCounterDefinitionV2 } from './impl/earthen-golem';
import { ElementalCounterDefinitionV2 } from './impl/elemental';
import { ElementalStreakCounterDefinitionV2 } from './impl/elemental-streak';
import { ElwynnBoarCounterDefinitionV2 } from './impl/elwynn-boar';
import { ExcavateCounterDefinitionV2 } from './impl/excavate';
import { FatigueCounterDefinitionV2 } from './impl/fatigue';
import { FriendlyMinionsDeadThisGameCounterDefinitionV2 } from './impl/friendly-minions-dead-this-game';
import { GalakrondCounterDefinitionV2 } from './impl/galakrond';
import { GardensGraceCounterDefinitionV2 } from './impl/gardens-grace';
import { HeroPowerDamageCounterDefinitionV2 } from './impl/hero-power-damage';
import { HeroPowerUseCounterDefinitionV2 } from './impl/hero-power-used';
import { HolySpellsCounterDefinitionV2 } from './impl/holy-spells';
import { ImbueCounterDefinitionV2 } from './impl/imbue';
import { JadeGolemCounterDefinitionV2 } from './impl/jade-golem';
import { LibramPlayedCounterDefinitionV2 } from './impl/libram-played';
import { LibramReductionCounterDefinitionV2 } from './impl/libram-reduction';
import { LightrayCounterDefinitionV2 } from './impl/lightray';
import { LocationsUsedCounterDefinitionV2 } from './impl/locations-used';
import { MenagerieCounterDefinitionV2 } from './impl/menagerie';
import { MinionsDeadThisGameCounterDefinitionV2 } from './impl/minions-dead-this-game';
import { MulticasterCounterDefinitionV2 } from './impl/multicaster';
import { NagaGiantCounterDefinitionV2 } from './impl/naga-giant';
import { NextStarshipLaunchCounterDefinitionV2 } from './impl/next-starship-launch';
import { OverdraftCounterDefinitionV2 } from './impl/overdraft';
import { PiratesSummonedCounterDefinitionV2 } from './impl/pirates-summoned';
import { PogoCounterDefinitionV2 } from './impl/pogo';
import { ProtossMinionReductionCounterDefinitionV2 } from './impl/protoss-minion-reduction';
import { ProtossSpellsCounterDefinitionV2 } from './impl/protoss-spells';
import { QueensguardCounterDefinitionV2 } from './impl/queensguard';
import { RelicCounterDefinitionV2 } from './impl/relic';
import { RenferalTheMalignantCounterDefinitionV2 } from './impl/renferal-the-malignant';
import { SeaShantyCounterDefinitionV2 } from './impl/sea-shanty';
import { SecretsPlayedCounterDefinitionV2 } from './impl/secrets-played';
import { ShockspitterCounterDefinitionV2 } from './impl/shockspitter';
import { SpellCastOnFriendlyCharacterCounterDefinitionV2 } from './impl/spell-cast-on-friendly-character';
import { SpellsPlayedCounterDefinitionV2 as SpellsPlayedConstructedCounterDefinitionV2 } from './impl/spells-played';
import { StarshipsLaunchedCounterDefinitionV2 } from './impl/starships-launched';
import { TableFlipCounterDefinitionV2 } from './impl/table-flip';
import { ThirstyDrifterCounterDefinitionV2 } from './impl/thirsty-drifter';
import { TreantCounterDefinitionV2 } from './impl/treant';
import { TyrandeCounterDefinitionV2 } from './impl/tyrande';
import { VolatileSkeletonCounterDefinitionV2 } from './impl/volatile-skeleton';
import { WatchpostCounterDefinitionV2 } from './impl/watchpost';
import { WheelOfDeathCounterDefinitionV2 } from './impl/wheel-of-death';
import { YsondreCounterDefinitionV2 } from './impl/ysondre';

export const getAllCounters: (
	i18n: ILocalizationService,
	allCards: CardsFacadeService,
) => CounterDefinitionV2<any>[] = (i18n: ILocalizationService, allCards: CardsFacadeService) => [
	new DragonsInHandCounterDefinitionV2(i18n, allCards),
	new DragonsSummonedCounterDefinitionV2(i18n),
	new DragonsPlayedCounterDefinitionV2(i18n, allCards),
	new DarkGiftsCounterDefinitionV2(i18n, allCards),
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
	new StarshipsLaunchedCounterDefinitionV2(i18n, allCards),
	new SpellsPlayedConstructedCounterDefinitionV2(i18n),
	new LibramPlayedCounterDefinitionV2(i18n),
	new EarthenGolemCounterDefinitionV2(i18n, allCards),
	new CardsShuffledIntoDeckCounterDefinitionV2(i18n, allCards),
	new PiratesSummonedCounterDefinitionV2(i18n, allCards),
	new TreantCounterDefinitionV2(i18n, allCards),
	new ChainedGuardianCounterDefinitionV2(i18n, allCards),
	new RelicCounterDefinitionV2(i18n, allCards),
	new VolatileSkeletonCounterDefinitionV2(i18n, allCards),
	new MulticasterCounterDefinitionV2(i18n, allCards),
	new HeroPowerDamageCounterDefinitionV2(i18n, allCards),
	new QueensguardCounterDefinitionV2(i18n, allCards),
	new ShockspitterCounterDefinitionV2(i18n, allCards),
	new BonelordFrostwhisperCounterDefinitionV2(i18n, allCards),
	new AnachronosCounterDefinitionV2(i18n, allCards),
	new GardensGraceCounterDefinitionV2(i18n, allCards),
	new NagaGiantCounterDefinitionV2(i18n, allCards),
	new OverdraftCounterDefinitionV2(i18n, allCards),
	new CorpseSpentCounterDefinitionV2(i18n, allCards),
	new MenagerieCounterDefinitionV2(i18n, allCards),
	new HolySpellsCounterDefinitionV2(i18n, allCards),
	new LightrayCounterDefinitionV2(i18n, allCards),
	new TableFlipCounterDefinitionV2(i18n, allCards),
	new SecretsPlayedCounterDefinitionV2(i18n, allCards),
	new ChaoticTendrilCounterDefinitionV2(i18n, allCards),
	new ExcavateCounterDefinitionV2(i18n, allCards),
	new ElementalStreakCounterDefinitionV2(i18n, allCards),
	new CardsPlayedFromAnotherClassCounterDefinitionV2(i18n, allCards),
	new ThirstyDrifterCounterDefinitionV2(i18n, allCards),
	new WheelOfDeathCounterDefinitionV2(i18n, allCards),
	new SeaShantyCounterDefinitionV2(i18n, allCards),
	new LocationsUsedCounterDefinitionV2(i18n, allCards),
	new TyrandeCounterDefinitionV2(i18n),
	new AvianaElunesChoseCounterDefinitionV2(i18n),
	new HeroPowerUseCounterDefinitionV2(i18n, allCards),
	new YsondreCounterDefinitionV2(i18n, allCards),
	new BolnerHammerbeakCounterDefinitionV2(i18n, allCards),
	new CthunCounterDefinitionV2(i18n, allCards),
	new ElementalCounterDefinitionV2(i18n, allCards),
	new ElwynnBoarCounterDefinitionV2(i18n, allCards),
	new AbyssalCurseCounterDefinitionV2(i18n, allCards),
	new FatigueCounterDefinitionV2(i18n, allCards),
	new GalakrondCounterDefinitionV2(i18n, allCards),
	new JadeGolemCounterDefinitionV2(i18n, allCards),
	new AstralAutomatonCounterDefinitionV2(i18n, allCards),
	new PogoCounterDefinitionV2(i18n, allCards),
	new WatchpostCounterDefinitionV2(i18n, allCards),
	new FriendlyMinionsDeadThisGameCounterDefinitionV2(i18n),
	new ImbueCounterDefinitionV2(i18n, allCards),
	new RenferalTheMalignantCounterDefinitionV2(i18n, allCards),
	new DiveTheGolakkaDepthsCounterDefinitionV2(i18n, allCards),
	// BG
	new BeetlesBuffCounterDefinitionV2(i18n),
	new BallerBuffCounterDefinitionV2(i18n),
	new MagnetizedCounterDefinitionV2(i18n),
	new FreeRefreshCounterDefinitionV2(i18n),
	new SpellsPlayedCounterDefinitionV2(i18n),
	new GoldNextTurnCounterDefinitionV2(i18n, allCards),
	new BgsBloodGemCounterDefinitionV2(i18n, allCards),
	new BgsSouthseaStrongarmCounterDefinitionV2(i18n, allCards),
	new BgsMagmalocCounterDefinitionV2(i18n, allCards),
	new BgsMajordomoCounterDefinitionV2(i18n, allCards),
	new BgsTuskarrRaiderCounterDefinitionV2(i18n, allCards),
	new BgsLordOfGainsCounterDefinitionV2(i18n, allCards),
	new ElementalPowersBuffCounterDefinitionV2(i18n),
	new TavernSpellsBuffCounterDefinitionV2(i18n),
	new ElementalTavernBuffCounterDefinitionV2(i18n),
];

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| '__fatigue'
	| '_ceaselessExpanse'
	| 'diveTheGolakkaDepths'
	| 'darkGifts'
	| 'galakrond'
	| 'renferalTheMalignant'
	| 'cardsShuffledIntoDeck'
	| 'ysondre'
	| 'dragonsInHand'
	| 'imbue'
	| 'tableFlip'
	| 'heroPowerUse'
	| 'tyrande'
	| 'avianaElunesChosen'
	| 'cardsPlayedThisTurn'
	| 'nextStarshipLaunch'
	| 'protossMinionReduction'
	| 'protossSpells'
	| 'spellsOnFriendly'
	| 'pogo'
	| 'starshipsLaunched'
	| 'giftsPlayed'
	| 'freeRefresh'
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
	| 'abyssalCurse'
	| 'spells'
	| 'elemental'
	| 'watchpost'
	| 'libram'
	| 'libramReduction'
	| 'bolner'
	| 'monstrousParrot'
	| 'friendlyDeadMinionsThisGame'
	| 'deadMinionsThisGame'
	| 'damageTakenOnYourTurn'
	| 'seaShanty'
	| 'locationsUsed'
	| 'wheelOfDeath'
	| 'thirstyDrifter'
	| 'cardsPlayedFromAnotherClass'
	| 'cardsDrawn'
	| 'elementalStreak'
	| 'excavate'
	| 'chaoticTendril'
	| 'secretsPlayed'
	| 'lightray'
	| 'holySpells'
	| 'menagerie'
	| 'corpseSpent'
	| 'overdraft'
	| 'nagaGiant'
	| 'gardensGrace'
	| 'anachronos'
	| 'bonelordFrostwhisper'
	| 'queensguard'
	| 'heroPowerDamage'
	| 'shockspitter'
	| 'multicaster'
	| 'si7Counter'
	| 'elwynnBoar'
	| 'volatileSkeleton'
	| 'relic'
	| 'beetlesBuff'
	| 'bgsPogo'
	| 'bgsSouthseaStrongarm'
	| 'bgsMagmaloc'
	| 'bgsBloodGem'
	| 'bgsGoldDelta'
	| 'bgsLordOfGains'
	| 'bgsTuskarrRaider'
	| 'bgsMagnetized'
	| 'bgsSpellsPlayed'
	| 'ballerBuff'
	| 'elementalPowersBuff'
	| 'tavernSpellsBuff'
	| 'elementalTavernBuff'
	| 'bgsMajordomo';
