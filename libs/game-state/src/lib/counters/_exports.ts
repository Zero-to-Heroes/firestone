import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { CounterDefinitionV2 } from './_counter-definition-v2';
import { AbyssalCurseCounterDefinitionV2 } from './impl/abyssal-curse';
import { AnachronosCounterDefinitionV2 } from './impl/anachronos';
import { AnimalCompanionAuraCounterDefinitionV2 } from './impl/animal-companion-aura-counter';
import { AstralAutomatonCounterDefinitionV2 } from './impl/astral-automaton';
import { AvianaElunesChoseCounterDefinitionV2 } from './impl/aviana-elunes-chosen';
import { BashanaCounterDefinitionV2 } from './impl/bashana';
import { BgsAncestralAutomatonCounterDefinitionV2 } from './impl/battlegrounds/ancestral-automaton';
import { BallerBuffCounterDefinitionV2 } from './impl/battlegrounds/baller-buff';
import { BeetlesBuffCounterDefinitionV2 } from './impl/battlegrounds/beetles-buff';
import { BgsBloodGemCounterDefinitionV2 } from './impl/battlegrounds/bgs-blood-gem';
import { BgsLordOfGainsCounterDefinitionV2 } from './impl/battlegrounds/bgs-lord-of-gains';
import { BgsMagmalocCounterDefinitionV2 } from './impl/battlegrounds/bgs-magmaloc';
import { BgsMajordomoCounterDefinitionV2 } from './impl/battlegrounds/bgs-majordomo';
import { BgsSouthseaStrongarmCounterDefinitionV2 } from './impl/battlegrounds/bgs-southsea-strongarm';
import { BgsTuskarrRaiderCounterDefinitionV2 } from './impl/battlegrounds/bgs-tuskarr-raider';
import { DeepBlueCounterDefinitionV2 } from './impl/battlegrounds/deep-blue';
import { ElementalPowersBuffCounterDefinitionV2 } from './impl/battlegrounds/elemental-powers-buff';
import { ElementalTavernBuffCounterDefinitionV2 } from './impl/battlegrounds/elemental-tavern-buff';
import { FodderRefreshCounterDefinitionV2 } from './impl/battlegrounds/fodder-refresh';
import { FreeRefreshCounterDefinitionV2 } from './impl/battlegrounds/free-refresh';
import { GoldNextTurnCounterDefinitionV2 } from './impl/battlegrounds/gold-next-turn';
import { MrrgltonPlayedCounterDefinitionV2 } from './impl/battlegrounds/mrrglton-played';
import { RightmostBuffCounterDefinitionV2 } from './impl/battlegrounds/rightmost-buff';
import { SpellsPlayedCounterDefinitionV2 } from './impl/battlegrounds/spells-played';
import { TavernBuffCounterDefinitionV2 } from './impl/battlegrounds/tavern-buff';
import { TavernSpellsBuffCounterDefinitionV2 } from './impl/battlegrounds/tavern-spells-buff';
import { UndeadArmyCounterDefinitionV2 } from './impl/battlegrounds/undead-army';
import { VolumizerBuffCounterDefinitionV2 } from './impl/battlegrounds/volumizer-buff';
import { WhelpBuffCounterDefinitionV2 } from './impl/battlegrounds/whelp-buff';
import { BeastsSummonedCounterDefinitionV2 } from './impl/beasts-summoned';
import { BolnerHammerbeakCounterDefinitionV2 } from './impl/bolner-hammerbeak';
import { BonelordFrostwhisperCounterDefinitionV2 } from './impl/bonelord-frostwhisper';
import { CardsDiscardedCounterDefinitionV2 } from './impl/cards-discarded';
import { CardsDrawnCounterDefinitionV2 } from './impl/cards-drawn';
import { CardsDrawnThisTurnCounterDefinitionV2 } from './impl/cards-drawn-this-turn';
import { CardsPlayedFromAnotherClassCounterDefinitionV2 } from './impl/cards-played-from-another-class';
import { GiftsPlayedCounterDefinitionV2 } from './impl/cards-played-not-in-starting-deck';
import { CardsPlayedThisTurnCounterDefinitionV2 } from './impl/cards-played-this-turn';
import { CardsShuffledIntoDeckCounterDefinitionV2 } from './impl/cards-shuffled-into-deck';
import { CeaselessExpanseCounterDefinitionV2 } from './impl/ceaseless-expanse';
import { ChainedGuardianCounterDefinitionV2 } from './impl/chained-guardian';
import { ChaoticTendrilCounterDefinitionV2 } from './impl/chaotic-tendril';
import { ComboCardsPlayedCounterDefinitionV2 } from './impl/combo-cards-played';
import { CorpseSpentCounterDefinitionV2 } from './impl/corpse-spent';
import { CorpsesCounterDefinitionV2 } from './impl/corpses';
import { CthunCounterDefinitionV2 } from './impl/cthun';
import { DamageTakenOnYourTurnCounterDefinitionV2 } from './impl/damage-taken-on-your-turn';
import { DamageTakenThisTurnCounterDefinitionV2 } from './impl/damage-taken-this-turn';
import { DamageToOpponentThisTurnCounterDefinitionV2 } from './impl/damage-to-opponent-this-turn';
import { DarkGiftsCounterDefinitionV2 } from './impl/dark-gifts';
import { DeathwingReductionCounterDefinitionV2 } from './impl/deathwing-reduction';
import { DiscoversCounterDefinitionV2 } from './impl/discovers';
import { DiveTheGolakkaDepthsCounterDefinitionV2 } from './impl/dive-the-golakka-depths';
import { DragoncallerAlannaCounterDefinitionV2 } from './impl/dragoncaller-alanna';
import { DragonsInHandCounterDefinitionV2 } from './impl/dragons-in-hand';
import { DragonsPlayedCounterDefinitionV2 } from './impl/dragons-played';
import { DragonsSummonedCounterDefinitionV2 } from './impl/dragons-summoned';
import { EarthenGolemCounterDefinitionV2 } from './impl/earthen-golem';
import { ElementalCounterDefinitionV2 } from './impl/elemental';
import { ElementalStreakCounterDefinitionV2 } from './impl/elemental-streak';
import { ElizaGorebladeCounterDefinitionV2 } from './impl/eliza-goreblade';
import { ElwynnBoarCounterDefinitionV2 } from './impl/elwynn-boar';
import { ExcavateCounterDefinitionV2 } from './impl/excavate';
import { FatigueCounterDefinitionV2 } from './impl/fatigue';
import { FelSpellsPlayedCounterDefinitionV2 } from './impl/fel-spells-played';
import { FreebirdCounterDefinitionV2 } from './impl/freebird';
import { FriendlyAttacksCounterDefinitionV2 } from './impl/friendly-attacks';
import { FriendlyMinionsDeadThisGameCounterDefinitionV2 } from './impl/friendly-minions-dead-this-game';
import { FriendlyMinionsDeadThisTurnCounterDefinitionV2 } from './impl/friendly-minions-dead-this-turn';
import { FrostSpellsCounterDefinitionV2 } from './impl/frost-spells';
import { GalakrondCounterDefinitionV2 } from './impl/galakrond';
import { GardensGraceCounterDefinitionV2 } from './impl/gardens-grace';
import { HeraldCounterDefinitionV2 } from './impl/herald';
import { HeroDamageInstancesThisTurnCounterDefinitionV2 } from './impl/hero-damage-instances-this-turn';
import { HeroPowerDamageCounterDefinitionV2 } from './impl/hero-power-damage';
import { HeroPowerUseCounterDefinitionV2 } from './impl/hero-power-used';
import { HolySpellsCounterDefinitionV2 } from './impl/holy-spells';
import { ImbueCounterDefinitionV2 } from './impl/imbue';
import { JadeGolemCounterDefinitionV2 } from './impl/jade-golem';
import { KaelthasSunstriderSpellCycleCounterDefinitionV2 } from './impl/kaelthas-spell-cycle';
import { KiljaedenCounterDefinitionV2 } from './impl/kiljaeden';
import { LeylineSpellCostDiscountCounterDefinitionV2 } from './impl/leyline-spell-cost-discount-counter';
import { LeylineSpellEffectStrengthCounterDefinitionV2 } from './impl/leyline-spell-effect-strength-counter';
import { LeylineSpellTriggersCounterDefinitionV2 } from './impl/leyline-spell-triggers-counter';
import { LibramPlayedCounterDefinitionV2 } from './impl/libram-played';
import { LibramReductionCounterDefinitionV2 } from './impl/libram-reduction';
import { LightrayCounterDefinitionV2 } from './impl/lightray';
import { LocationsUsedCounterDefinitionV2 } from './impl/locations-used';
import { MenagerieCounterDefinitionV2 } from './impl/menagerie';
import { MinionsDeadThisGameCounterDefinitionV2 } from './impl/minions-dead-this-game';
import { MinionsDeadThisTurnCounterDefinitionV2 } from './impl/minions-dead-this-turn';
import { MulticasterCounterDefinitionV2 } from './impl/multicaster';
import { NagaGiantCounterDefinitionV2 } from './impl/naga-giant';
import { NextStarshipLaunchCounterDefinitionV2 } from './impl/next-starship-launch';
import { NonClassCardsAddedToHandCounterDefinitionV2 } from './impl/non-class-cards-added-to-hand';
import { OutcastCounterDefinitionV2 } from './impl/outcast';
import { OverdraftCounterDefinitionV2 } from './impl/overdraft';
import { OverloadCardsPlayedCounterDefinitionV2 } from './impl/overload-cards-played';
import { OverloadThisGameCounterDefinitionV2 } from './impl/overload-this-game';
import { PiratesSummonedCounterDefinitionV2 } from './impl/pirates-summoned';
import { PogoCounterDefinitionV2 } from './impl/pogo';
import { ProtossMinionReductionCounterDefinitionV2 } from './impl/protoss-minion-reduction';
import { ProtossSpellsCounterDefinitionV2 } from './impl/protoss-spells';
import { QueensguardCounterDefinitionV2 } from './impl/queensguard';
import { RafaamTimeCounterDefinitionV2 } from './impl/rafaam-time';
import { RelicCounterDefinitionV2 } from './impl/relic';
import { RenferalTheMalignantCounterDefinitionV2 } from './impl/renferal-the-malignant';
import { RuniTemporalGuardianCounterDefinitionV2 } from './impl/runi-temporal-guardian';
import { SeaShantyCounterDefinitionV2 } from './impl/sea-shanty';
import { SecretsPlayedCounterDefinitionV2 } from './impl/secrets-played';
import { SecretsTriggeredCounterDefinitionV2 } from './impl/secrets-triggered';
import { ShirvallahCounterDefinitionV2 } from './impl/shirvallah';
import { ShockspitterCounterDefinitionV2 } from './impl/shockspitter';
import { SilverHandRecruitAuraCounterDefinitionV2 } from './impl/silver-hand-recruit-aura-counter';
import { SpellCastOnFriendlyCharacterCounterDefinitionV2 } from './impl/spell-cast-on-friendly-character';
import { SpellsPlayedCounterDefinitionV2 as SpellsPlayedConstructedCounterDefinitionV2 } from './impl/spells-played';
import { SpellweaversBrillianceCounterDefinitionV2 } from './impl/spellweavers-brilliance';
import { StarshipsLaunchedCounterDefinitionV2 } from './impl/starships-launched';
import { TableFlipCounterDefinitionV2 } from './impl/table-flip';
import { TalyaEarthstriderGlobalAuraCounterDefinitionV2 } from './impl/talya-earthstrider-global-aura-counter';
import { ThirstyDrifterCounterDefinitionV2 } from './impl/thirsty-drifter';
import { TotemsSummonedCounterDefinitionV2 } from './impl/totems-summoned';
import { TreantCounterDefinitionV2 } from './impl/treant';
import { TreantDeadCounterDefinitionV2 } from './impl/treant-dead';
import { TyrandeCounterDefinitionV2 } from './impl/tyrande';
import { VolatileSkeletonCounterDefinitionV2 } from './impl/volatile-skeleton';
import { WatchpostCounterDefinitionV2 } from './impl/watchpost';
import { WeaponsEquippedCounterDefinitionV2 } from './impl/weapons-equipped';
import { WheelOfDeathCounterDefinitionV2 } from './impl/wheel-of-death';
import { WindrunnerSistersCounterDefinitionV2 } from './impl/windrunner-sisters';
import { YsondreCounterDefinitionV2 } from './impl/ysondre';

export const getAllCounters: (
	i18n: ILocalizationService,
	allCards: CardsFacadeService,
) => CounterDefinitionV2<any>[] = (i18n: ILocalizationService, allCards: CardsFacadeService) => [
	new DragonsInHandCounterDefinitionV2(i18n, allCards),
	new DragonsSummonedCounterDefinitionV2(i18n, allCards),
	new DragonsPlayedCounterDefinitionV2(i18n, allCards),
	new DarkGiftsCounterDefinitionV2(i18n, allCards),
	new CeaselessExpanseCounterDefinitionV2(i18n, allCards),
	new KiljaedenCounterDefinitionV2(i18n, allCards),
	new DiscoversCounterDefinitionV2(i18n, allCards),
	new LibramReductionCounterDefinitionV2(i18n, allCards),
	new CardsDrawnCounterDefinitionV2(i18n, allCards),
	new SpellCastOnFriendlyCharacterCounterDefinitionV2(i18n, allCards),
	new GiftsPlayedCounterDefinitionV2(i18n, allCards),
	new ComboCardsPlayedCounterDefinitionV2(i18n, allCards),
	new DamageTakenOnYourTurnCounterDefinitionV2(i18n, allCards),
	new ProtossMinionReductionCounterDefinitionV2(i18n, allCards),
	new ProtossSpellsCounterDefinitionV2(i18n, allCards),
	new NextStarshipLaunchCounterDefinitionV2(i18n, allCards),
	new CardsPlayedThisTurnCounterDefinitionV2(i18n, allCards),
	new MinionsDeadThisGameCounterDefinitionV2(i18n, allCards),
	new BashanaCounterDefinitionV2(i18n, allCards),
	new StarshipsLaunchedCounterDefinitionV2(i18n, allCards),
	new SpellsPlayedConstructedCounterDefinitionV2(i18n, allCards),
	new LibramPlayedCounterDefinitionV2(i18n, allCards),
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
	new RuniTemporalGuardianCounterDefinitionV2(i18n, allCards),
	new GardensGraceCounterDefinitionV2(i18n, allCards),
	new NagaGiantCounterDefinitionV2(i18n, allCards),
	new OverdraftCounterDefinitionV2(i18n, allCards),
	new CorpsesCounterDefinitionV2(i18n, allCards),
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
	new TyrandeCounterDefinitionV2(i18n, allCards),
	new AvianaElunesChoseCounterDefinitionV2(i18n, allCards),
	new DeathwingReductionCounterDefinitionV2(i18n, allCards),
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
	new KaelthasSunstriderSpellCycleCounterDefinitionV2(i18n, allCards),
	new AstralAutomatonCounterDefinitionV2(i18n, allCards),
	new PogoCounterDefinitionV2(i18n, allCards),
	new WatchpostCounterDefinitionV2(i18n, allCards),
	new FriendlyMinionsDeadThisGameCounterDefinitionV2(i18n, allCards),
	new ImbueCounterDefinitionV2(i18n, allCards),
	new HeraldCounterDefinitionV2(i18n, allCards),
	new RenferalTheMalignantCounterDefinitionV2(i18n, allCards),
	new DiveTheGolakkaDepthsCounterDefinitionV2(i18n, allCards),
	new ElizaGorebladeCounterDefinitionV2(i18n, allCards),
	new RafaamTimeCounterDefinitionV2(i18n, allCards),
	new WindrunnerSistersCounterDefinitionV2(i18n, allCards),
	new CardsDrawnThisTurnCounterDefinitionV2(i18n, allCards),
	new DragoncallerAlannaCounterDefinitionV2(i18n, allCards),
	new TreantDeadCounterDefinitionV2(i18n, allCards),
	new MinionsDeadThisTurnCounterDefinitionV2(i18n, allCards),
	new OverloadThisGameCounterDefinitionV2(i18n, allCards),
	new OutcastCounterDefinitionV2(i18n, allCards),
	new SecretsTriggeredCounterDefinitionV2(i18n, allCards),
	new ShirvallahCounterDefinitionV2(i18n, allCards),
	new OverloadCardsPlayedCounterDefinitionV2(i18n, allCards),
	new FreebirdCounterDefinitionV2(i18n, allCards),
	new FrostSpellsCounterDefinitionV2(i18n, allCards),
	new FriendlyMinionsDeadThisTurnCounterDefinitionV2(i18n, allCards),
	new DamageTakenThisTurnCounterDefinitionV2(i18n, allCards),
	new DamageToOpponentThisTurnCounterDefinitionV2(i18n, allCards),
	new HeroDamageInstancesThisTurnCounterDefinitionV2(i18n, allCards),
	new NonClassCardsAddedToHandCounterDefinitionV2(i18n, allCards),
	new TotemsSummonedCounterDefinitionV2(i18n, allCards),
	new BeastsSummonedCounterDefinitionV2(i18n, allCards),
	new WeaponsEquippedCounterDefinitionV2(i18n, allCards),
	new FelSpellsPlayedCounterDefinitionV2(i18n, allCards),
	new CardsDiscardedCounterDefinitionV2(i18n, allCards),
	new FriendlyAttacksCounterDefinitionV2(i18n, allCards),
	new SpellweaversBrillianceCounterDefinitionV2(i18n, allCards),
	// BG
	new BeetlesBuffCounterDefinitionV2(i18n, allCards),
	new BallerBuffCounterDefinitionV2(i18n, allCards),
	// new MagnetizedCounterDefinitionV2(i18n),
	new FreeRefreshCounterDefinitionV2(i18n, allCards),
	new SpellsPlayedCounterDefinitionV2(i18n, allCards),
	new GoldNextTurnCounterDefinitionV2(i18n, allCards),
	new BgsBloodGemCounterDefinitionV2(i18n, allCards),
	new BgsSouthseaStrongarmCounterDefinitionV2(i18n, allCards),
	new BgsMagmalocCounterDefinitionV2(i18n, allCards),
	new BgsMajordomoCounterDefinitionV2(i18n, allCards),
	new BgsTuskarrRaiderCounterDefinitionV2(i18n, allCards),
	new BgsLordOfGainsCounterDefinitionV2(i18n, allCards),
	new ElementalPowersBuffCounterDefinitionV2(i18n, allCards),
	new TavernSpellsBuffCounterDefinitionV2(i18n, allCards),
	new ElementalTavernBuffCounterDefinitionV2(i18n, allCards),
	new DeepBlueCounterDefinitionV2(i18n, allCards),
	new UndeadArmyCounterDefinitionV2(i18n, allCards),
	new VolumizerBuffCounterDefinitionV2(i18n, allCards),
	new WhelpBuffCounterDefinitionV2(i18n, allCards),
	new RightmostBuffCounterDefinitionV2(i18n, allCards),
	new TavernBuffCounterDefinitionV2(i18n, allCards),
	new FodderRefreshCounterDefinitionV2(i18n, allCards),
	new MrrgltonPlayedCounterDefinitionV2(i18n, allCards),
	new BgsAncestralAutomatonCounterDefinitionV2(i18n, allCards),
	new LeylineSpellCostDiscountCounterDefinitionV2(i18n, allCards),
	new LeylineSpellTriggersCounterDefinitionV2(i18n, allCards),
	new LeylineSpellEffectStrengthCounterDefinitionV2(i18n, allCards),
	new AnimalCompanionAuraCounterDefinitionV2(i18n, allCards),
	new SilverHandRecruitAuraCounterDefinitionV2(i18n, allCards),
	new TalyaEarthstriderGlobalAuraCounterDefinitionV2(i18n, allCards),
];

export type { CounterType } from './counter-type';
