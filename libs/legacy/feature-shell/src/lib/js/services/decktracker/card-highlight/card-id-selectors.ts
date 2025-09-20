import { CardClass, CardIds, CardType, GameTag, Race, SpellSchool } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, getCost, getProcessedCard } from '@firestone/game-state';
import { groupByFunction, pickLast, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { Selector, SelectorInput, SelectorOutput } from './cards-highlight-common.service';
import {
	and,
	arcane,
	attackGreaterThan,
	attackIs,
	attackLessThan,
	aura,
	baseCostEqual,
	baseCostLessThan,
	battlecry,
	beast,
	bloodRune,
	canTargetFriendlyCharacter,
	canTargetFriendlyMinion,
	cardIs,
	cardType,
	cardsPlayedLastTurn,
	cardsPlayedThisMatch,
	cardsPlayedThisTurn,
	charge,
	chooseOne,
	combo,
	corrupt,
	corrupted,
	costMore,
	currentClass,
	damage,
	darkGift,
	damage as dealsDamage,
	deathrattle,
	demon,
	discarded,
	discover,
	divineShield,
	draenei,
	dragon,
	dredge,
	effectiveCostEqual,
	effectiveCostLess,
	effectiveCostLessThanRemainingMana,
	effectiveCostMore,
	elemental,
	entityIs,
	excavate,
	fel,
	fire,
	forge,
	freeze,
	frenzy,
	fromAnotherClass,
	fromAnotherClassStrict,
	frost,
	generateCorpse,
	generateSlagclaw,
	generatesPlague,
	generatesTemporaryCard,
	givesArmor,
	givesHeroAttack,
	hasMultipleCopies,
	hasSpellSchool,
	hasTribeNotPlayedThisMatch,
	healthBiggerThanAttack,
	healthIs,
	healthLessThan,
	highlightConditions,
	holy,
	imbue,
	imp,
	inDeck,
	inGraveyard,
	inHand,
	inInitialDeck,
	inOther,
	inPlay,
	inStartingHand,
	infuse,
	isPlague,
	isSi7,
	isTreant,
	kindred,
	lastAffectedByCardId,
	legendary,
	libram,
	libramDiscount,
	lifesteal,
	location,
	locationExtended,
	magnetic,
	mech,
	minion,
	minionPlayedThisMatch,
	minionsDeadSinceLastTurn,
	murloc,
	naga,
	nature,
	neutral,
	not,
	notInInitialDeck,
	opposingSide,
	or,
	outcast,
	overload,
	paladin,
	pirate,
	protoss,
	quickdraw,
	race,
	reborn,
	relic,
	restoreHealth,
	restoreHealthToMinion,
	rush,
	secret,
	secretsTriggeredThisMatch,
	selfDamageHero,
	shadow,
	shufflesCardIntoDeck,
	side,
	spell,
	spellDamage,
	spellPlayedThisMatch,
	spellPlayedThisMatchOnFriendly,
	spellSchool,
	spellSchoolPlayedThisMatch,
	spendCorpse,
	starshipExtended,
	summonsTreant,
	taunt,
	templar,
	terran,
	tooltip,
	totem,
	tradeable,
	tribeless,
	undead,
	unholyRune,
	weapon,
	whelp,
	windfury,
	zerg,
} from './selectors';

export const cardIdSelector = (
	cardId: string,
	card: DeckCard | undefined,
	inputSide: HighlightSide,
	allCards: CardsFacadeService,
): Selector => {
	switch (cardId) {
		case CardIds.AbsorbentParasite:
			return and(side(inputSide), or(inDeck, inHand), minion, or(mech, beast));
		case CardIds.AbyssalBassist:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.AbyssalDepths:
			return (input: SelectorInput): SelectorOutput => {
				const cheapestMinions = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => a.getEffectiveManaCost() - b.getEffectiveManaCost())
					.slice(0, 2);
				const secondCheapestMinionCost =
					(cheapestMinions[1] ?? cheapestMinions[0])?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostLess(secondCheapestMinionCost + 1)),
					and(side(inputSide), inDeck, minion),
				)(input);
			};
		case CardIds.AceWayfinder_GDB_450:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.AcolyteOfDeath:
		case CardIds.AcolyteOfDeath_CORE_RLK_121:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.AddledGrizzly:
		case CardIds.AddledGrizzly_WON_009:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.AdrenalineFiend_VAC_927:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.AdvancedTargetingMonocle:
			return and(side(inputSide), inDeck, spell);
		case CardIds.AegwynnTheGuardianCore:
		case CardIds.AegwynnTheGuardian_LEG_CS3_001:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Aeroponics:
			return and(side(inputSide), or(inHand, inDeck), or(summonsTreant, isTreant));
		case CardIds.AfterlifeAttendant:
		case CardIds.AfterlifeAttendant_CORE_MAW_031:
			return and(side(inputSide), or(inDeck, inHand), infuse);
		case CardIds.AirGuitarist:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.AkaliTheRhino:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.AlakirTheWindsOfTime_WON_092h:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, charge),
				and(side(inputSide), inDeck, minion, divineShield),
				and(side(inputSide), inDeck, minion, taunt),
				and(side(inputSide), inDeck, minion, windfury),
			);
		case CardIds.AlarmedSecuritybot_YOG_510:
			return and(side(inputSide), inDeck, minion);
		case CardIds.AldorAttendant:
			return and(side(inputSide), or(inDeck, inHand), libram);
		case CardIds.AldorTruthseeker:
			return and(side(inputSide), or(inDeck, inHand), libram);
		case CardIds.AlienEncounters_GDB_237:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.AllFelBreaksLoose:
		case CardIds.AllFelBreaksLoose_CORE_MAW_012:
		case CardIds.AllFelBreaksLoose_AllFelBreaksLooseToken:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), demon),
				and(side(inputSide), inGraveyard, demon),
			);
		case CardIds.AllianceBannerman:
			return and(side(inputSide), inDeck, minion);
		case CardIds.AllShallServeTavernBrawl:
			return and(side(inputSide), minion, demon);
		case CardIds.AllTogetherNowTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), battlecry, effectiveCostMore(2));
		case CardIds.AllYouCanEat_VAC_528:
			return and(side(inputSide), inDeck, minion, not(tribeless));
		case CardIds.AlteredChord:
			return and(side(inputSide), or(inHand, inDeck), overload);
		case CardIds.AlwaysABiggerJormungar:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AmalgamOfTheDeep:
			return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
		case CardIds.AmateurPuppeteer_TOY_828:
		case CardIds.AmateurPuppeteer_AmateurPuppeteerToken_TOY_828t:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.AmberWhelp:
			return and(side(inputSide), or(inDeck, inHand), minion, dragon);
		case CardIds.AmitusThePeacekeeper:
			return and(side(inputSide), inDeck, minion);
		case CardIds.AmorphousSlime:
			return and(side(inputSide), or(inHand, inDeck), undead, minion);
		case CardIds.AmitusThePeacekeeper_ReinforcedToken:
			return and(side(inputSide), inDeck, minion);
		case CardIds.AmuletOfUndying:
			return and(side(inputSide), inGraveyard, minion, deathrattle);
		case CardIds.AncestorsCall:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Ancharrr:
			return and(side(inputSide), inDeck, minion, pirate);
		case CardIds.Anchorite_GDB_441:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthToMinion),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.AncientKrakenbane:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.AncientMysteries:
			return and(side(inputSide), inDeck, secret);
		case CardIds.AncientOfGrowth:
		case CardIds.AncientOfGrowth_AncientGrowth:
			return and(side(inputSide), or(inDeck, inHand), or(isTreant, summonsTreant));
		case CardIds.AnimaExtractor:
		case CardIds.AnimaExtractor_CORE_REV_332:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AnimateDead:
			return and(side(inputSide), inGraveyard, minion, effectiveCostLess(4));
		case CardIds.AnimatedAvalanche:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.AnimatedBerserker_CORE_ICC_238:
		case CardIds.AnimatedBerserker_ICC_238:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.AnimatedMoonwell_EDR_254:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.AnonymousInformant:
		case CardIds.AnonymousInformant_CORE_REV_841:
			return and(side(inputSide), or(inDeck, inHand), secret);
		case CardIds.AntiqueFlinger_WW_413:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.Anubrekhan_RLK_659:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ApexisBlast:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ApothecarysCaravan:
			return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
		case CardIds.AquaArchivist:
			return and(side(inputSide), inDeck, minion, elemental);
		case CardIds.ArcaneArtificer:
		case CardIds.ArcaneArtificerCore:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ArcaneBrilliance:
			return and(
				side(inputSide),
				inDeck,
				spell,
				or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
			);
		case CardIds.ArcaneFluxTavernBrawl:
			return and(side(inputSide), spell, arcane);
		case CardIds.ArcaneLuminary:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.ArcaneQuiver_RLK_817:
			return highlightConditions(and(side(inputSide), inDeck, arcane), and(side(inputSide), inDeck, spell));
		case CardIds.ArcaniteCrystalTavernBrawl:
			return and(side(inputSide), spell, arcane);
		case CardIds.Arcanologist:
			return and(side(inputSide), inDeck, spell, secret);
		case CardIds.ArcanologistCore:
			return and(side(inputSide), inDeck, spell, secret);
		case CardIds.ArchdruidOfThorns_EDR_491:
			return and(side(inputSide), or(inHand, inDeck), deathrattle, minion);
		case CardIds.Archimonde_GDB_128:
			return and(side(inputSide), or(inDeck, inHand, inGraveyard), demon, notInInitialDeck);
		case CardIds.ArchmageAntonidas:
		case CardIds.ArchmageAntonidasLegacy:
		case CardIds.ArchmageAntonidas_CORE_EX1_559:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ArchmageVargoth:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ArcticArmorTavernBrawl:
			return and(side(inputSide), freeze);
		case CardIds.AridStormer:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.ArkoniteRevelation_GDB_852:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ArmsDealer_RLK_824:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.TheLichKing_ArmyOfTheFrozenThroneToken:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ArrowSmith:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Artanis_SC_754:
			return and(side(inputSide), or(inHand, inDeck), protoss, minion);
		case CardIds.AshleafPixie_FIR_961:
			return and(side(inputSide), or(inHand, inDeck), spell, effectiveCostMore(4));
		case CardIds.Askara_GDB_455:
			return and(side(inputSide), or(inHand, inDeck), draenei);
		case CardIds.Assembly:
		case CardIds.Assembly_Assembly:
			return and(side(inputSide), inDeck, minion);
		case CardIds.AstralVigilant_GDB_461:
			return (input: SelectorInput): SelectorOutput => {
				const draeneiPlayed = input.deckState.cardsPlayedThisMatch.filter(
					(c) =>
						allCards.getCard(c.cardId).races?.includes(Race[Race.DRAENEI]) ||
						allCards.getCard(c.cardId).races?.includes(Race[Race.ALL]),
				);
				const lastCardPlayed = draeneiPlayed.length ? draeneiPlayed[draeneiPlayed.length - 1] : null;
				return highlightConditions(
					tooltip(
						and(
							side(inputSide),
							entityIs({ entityId: lastCardPlayed?.entityId, cardId: lastCardPlayed?.cardId }),
						),
					),
					and(side(inputSide), or(inDeck, inHand), draenei),
				)(input);
			};
		case CardIds.AuchenaiPhantasm:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		case CardIds.AuchenaiDeathSpeaker_GDB_469:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, reborn),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.AuchenaiSoulpriestLegacy:
		case CardIds.AuchenaiSoulpriestVanilla:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		case CardIds.AuctionhouseGavel:
			return and(side(inputSide), or(inDeck, inHand), battlecry, minion);
		case CardIds.AudioSplitter:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Aviana:
		case CardIds.Aviana_WON_012:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AwakenTheMakers:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.AxeBerserker:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.AzeriteGiant_WW_025:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.AzsharanGardens_SunkenGardensToken:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AzsharanSaber_SunkenSaberToken:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.AzsharanScavenger_SunkenScavengerToken:
			return and(side(inputSide), minion, murloc);
		case CardIds.BabaNaga:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.BackstageBouncer:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BadlandsBrawler_WW_349:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.BadOmen_GDB_124:
			return and(side(inputSide), or(inDeck, inHand, inOther), starshipExtended);
		case CardIds.BalindaStonehearth:
			return and(side(inputSide), inDeck, spell);
		case CardIds.BandOfBeesTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, effectiveCostLess(3));
		case CardIds.BanelingBarrage_SC_001:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.Banjosaur:
			return and(side(inputSide), inDeck, beast, minion);
		case CardIds.Banshee_RLK_957:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.BarakKodobane_BAR_551:
		case CardIds.BarakKodobane_CORE_BAR_551:
			return and(
				side(inputSide),
				inDeck,
				spell,
				or(effectiveCostEqual(1), effectiveCostEqual(2), effectiveCostEqual(3)),
			);
		case CardIds.BarbaricSorceress:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.BarbedNets:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.BargainBin_MIS_105:
			return highlightConditions(
				and(side(inputSide), inDeck, minion),
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), inDeck, weapon),
			);
		case CardIds.Barnes:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BaritoneImp:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.CrazedConductor, CardIds.Crescendo));
		case CardIds.BaronRivendare_FP1_031:
		case CardIds.BaronRivendare_CORE_FP1_031:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.BarrelRoll_GDB_465:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.BarrensTrapper:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.BarricadeBasher_DINO_400:
			return and(side(inputSide), or(inHand, inDeck), givesArmor);
		case CardIds.BartendOBot_WW_408:
			return and(side(inputSide), inDeck, outcast);
		case CardIds.Battlepickaxe_WW_347:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.BattleTotem_LOOTA_846:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.BeanstalkBrute_EDR_230:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BeckoningBicornTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.ArchVillainRafaam_BeholdMyStuff_THD_032p:
			return and(side(inputSide), or(inDeck, inHand), legendary);
		case CardIds.BenevolentBanker_WW_384:
			return and(inDeck, spell);
		case CardIds.BigDreams:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.Bioluminescence:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.Birdwatching_VAC_408:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BitterColdTavernBrawl:
			return and(side(inputSide), frost, dealsDamage);
		case CardIds.BlackHole_GDB_126:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.BlackrockNRoll:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BlackscaleBrute:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		case CardIds.BlackwingCorruptor:
		case CardIds.BlackwingCorruptor_WON_329:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.BladeOfQuickeningTavernBrawlToken:
			return and(side(inputSide), inDeck, outcast);
		case CardIds.BladeOfTheBurningSun:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Blazecaller:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.BlazingAccretion_GDB_302:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, fire),
				and(side(inputSide), or(inHand, inDeck), minion, elemental),
			);
		case CardIds.BlindeyeSharpshooter_WW_402:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), naga),
				and(side(inputSide), or(inDeck, inHand), spell),
			);
		case CardIds.Blink_SC_761:
			return and(side(inputSide), inDeck, protoss, minion);
		case CardIds.Bloodbloom:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.BloodCrusader:
			return and(side(inputSide), or(inDeck, inHand), paladin, minion);
		case CardIds.BloodMoonTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BloodOfGhuun:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BloodreaverGuldan_CORE_ICC_831:
		case CardIds.BloodreaverGuldan_ICC_831:
			return and(side(inputSide), inGraveyard, minion, demon);
		case CardIds.BobTheBartender_BG31_BOB:
		case CardIds.BobTheBartender_FindATripleToken_BG31_BOBt4:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Bolster:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.Bonecaller:
			return and(side(inputSide), inGraveyard, minion, undead);
		case CardIds.BoneFlinger:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.BonecrusherTavernBrawlToken:
			return tooltip(and(side(inputSide), inGraveyard, minion, deathrattle));
		case CardIds.Boneshredder:
			return highlightConditions(
				tooltip(and(side(inputSide), inGraveyard, minion, deathrattle)),
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), inGraveyard, minion, deathrattle),
			);
		case CardIds.BoogieDown:
			return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
		case CardIds.DrBoom_BoomBarrage_THD_034p:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.BookOfSpecters:
			return and(side(inputSide), inDeck, spell);
		case CardIds.BoomWrench_TOY_604:
		case CardIds.BoomWrench_BoomWrenchToken_TOY_604t:
			return and(side(inputSide), or(inHand, inDeck), deathrattle, mech);
		case CardIds.BottomlessToyChest_TOY_851:
			return and(side(inputSide), or(inHand, inDeck), spellDamage);
		case CardIds.BountyBoard_WW_003:
			return and(side(inputSide), or(inDeck, inHand, inOther), or(excavate, quickdraw, tradeable, legendary));
		case CardIds.Braingill_GDB_878:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.BralmaSearstone_TLC_228:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.BrannBronzebeard_CORE_LOE_077:
		case CardIds.BrannBronzebeard_LOE_077:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.BrannBronzebeard_BrannsSaddle_THD_042p:
			return and(side(inputSide), or(inDeck, inHand), minion, battlecry);
		case CardIds.Breakdance:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BreathOfDreams:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.BrilliantMacaw:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.BrittleboneBuccaneer_VAC_436:
			return and(side(inputSide), or(inDeck, inHand), deathrattle, minion);
		case CardIds.BrittleboneDestroyer:
			// Self-damage, like weapons, might be useful to highlight?
			return and(side(inputSide), or(inDeck, inHand), or(restoreHealth, lifesteal));
		case CardIds.BrollBearmantle_EDR_853:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.BronzeSignetTavernBrawl:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BroodKeeper_EDR_457:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.Bubblebot_TSC_059:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.BulkUp:
			return and(side(inputSide), or(inDeck, inHand), taunt, minion);
		case CardIds.BumblingBellhop_VAC_521:
			return and(side(inputSide), or(inDeck, inHand), spell, costMore(4));
		case CardIds.BunnyStomper_WW_435:
			return and(side(inputSide), or(inDeck, inHand, inPlay), beast);
		case CardIds.BusyBot_WORK_002:
			return and(side(inputSide), or(inDeck, inHand), minion, attackIs(1));
		case CardIds.BusyPeon_WORK_041:
			return and(side(inputSide), or(inDeck, inHand), locationExtended);
		case CardIds.ButchTavernBrawl:
			return and(side(inputSide), inGraveyard, beast);
		case CardIds.Buttons_VAC_437:
			return and(side(inputSide), inDeck, spell, hasSpellSchool);
		case CardIds.CabaretHeadliner_VAC_954:
			return and(side(inputSide), inDeck, spell, hasSpellSchool);
		case CardIds.CactusCutter_WW_327:
			return and(side(inputSide), inDeck, spell);
		case CardIds.CadaverCollectorTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.CallPet_GVG_017:
			return and(side(inputSide), inDeck, beast);
		case CardIds.CallToAdventure:
			return (input: SelectorInput): SelectorOutput => {
				const cheapestMinion = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => a.getEffectiveManaCost() - b.getEffectiveManaCost())[0];
				const cheapestMinionCost = cheapestMinion?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostEqual(cheapestMinionCost)),
					and(side(inputSide), inDeck, minion),
				)(input);
			};
		case CardIds.CallToArms:
			return and(side(inputSide), inDeck, minion, effectiveCostLess(3));
		case CardIds.CagematchCustodian:
			return and(side(inputSide), inDeck, cardType(CardType.WEAPON));
		case CardIds.CannonBarrage:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.CaptainsLog_GDB_228:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.CaptainsParrotLegacy:
		case CardIds.CaptainsParrotVanilla:
			return and(side(inputSide), inDeck, pirate);
		case CardIds.CaptureColdtoothMine:
			return (input: SelectorInput): SelectorOutput => {
				const allCardsOrderedByCost = [...input.deckState.deck].sort(
					(a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost(),
				);
				const highestCostCard = allCardsOrderedByCost[0];
				const highestCardCost = highestCostCard?.getEffectiveManaCost() ?? 0;
				const lowestCostCard = allCardsOrderedByCost[allCardsOrderedByCost.length - 1];
				const lowestCardCost = lowestCostCard?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostEqual(highestCardCost)),
					and(side(inputSide), inDeck, minion, effectiveCostEqual(lowestCardCost)),
				)(input);
			};
		case CardIds.CapturedFlag:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.CardGrader_TOY_054:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.CariaFelsoul:
			return and(side(inputSide), inDeck, demon);
		case CardIds.CaricatureArtist_TOY_391:
			return and(side(inputSide), inDeck, minion, effectiveCostMore(4));
		case CardIds.CarielRoame_BAR_902:
			return and(side(inputSide), or(inHand, inDeck), holy, spell);
		case CardIds.CarnivorousCube:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.CarnivorousCubicle_WORK_042:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.CarressCabaretStar_VAC_449:
			return and(side(inputSide), or(inHand, inDeck), spell, hasSpellSchool);
		case CardIds.CarrionStudies:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.CastleKennels_REV_362:
		case CardIds.CastleKennels_REV_790:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.CatrinaMuerteCore:
		case CardIds.CatrinaMuerte:
			return highlightConditions(
				and(side(inputSide), inGraveyard, undead, minion),
				and(side(inputSide), or(inHand, inDeck), undead),
			);
		case CardIds.CattleRustler_WW_351:
			return and(side(inputSide), inDeck, beast);
		case CardIds.CelestialShot_YOG_082:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.CenarionHold_WON_015:
			return and(side(inputSide), or(inHand, inDeck), chooseOne);
		case CardIds.ChainedGuardian:
			return and(side(inputSide), or(inHand, inDeck), generatesPlague);
		case CardIds.ChampionOfStorms:
			return and(side(inputSide), or(inHand, inDeck), spell, nature);
		case CardIds.CharredChameleon_FIR_908:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.ChattyBartender:
			return and(side(inputSide), inDeck, secret);
		case CardIds.ChattyMacaw_VAC_407:
			return (input: SelectorInput): SelectorOutput => {
				const lastSpellOnEnemy = input.deckState.spellsPlayedOnEnemyEntities?.length
					? input.deckState.spellsPlayedOnEnemyEntities[
							input.deckState.spellsPlayedOnEnemyEntities.length - 1
						]
					: null;
				return tooltip(
					and(
						side(inputSide),
						entityIs({ entityId: lastSpellOnEnemy?.entityId, cardId: lastSpellOnEnemy?.cardId }),
						spell,
					),
				)(input);
			};
		case CardIds.ChemicalSpill_TOY_602:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.ChiaDrake_TOY_801:
		case CardIds.ChiaDrake_ChiaDrakeToken_TOY_801t:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, dealsDamage),
				and(side(inputSide), inDeck, spell),
			);
		case CardIds.ChiaDrake_SeedlingGrowth_TOY_801b:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		case CardIds.ChiaDrake_Cultivate_TOY_801a:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Chillmaw:
		case CardIds.Chillmaw_CORE_AT_123:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.Chogall_WON_105:
		case CardIds.Chogall_OG_121:
			return tooltip(and(side(inputSide), discarded));
		case CardIds.ChorusRiff:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ChronoBoost_SC_750:
			return and(side(inputSide), inDeck, protoss);
		case CardIds.Cindersword_FIR_922:
			return and(side(inputSide), or(inHand, inDeck), darkGift);
		case CardIds.ClassActionLawyer:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.ClawMachine:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ClearancePromoter_TOY_390:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ClearTheWay:
			return and(side(inputSide), or(inHand, inDeck), minion, rush);
		case CardIds.ClericOfAnshe:
			return highlightConditions(
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), or(inDeck, inHand), restoreHealth),
			);
		case CardIds.ClericOfScales:
			return highlightConditions(
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), or(inDeck, inHand), dragon),
			);
		case CardIds.ClickClocker:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.CliffDive_VAC_926:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ClimacticNecroticExplosion:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.ClimbingHook_VAC_932:
			return and(side(inputSide), or(inDeck, inHand), minion, attackGreaterThan(4));
		case CardIds.ClockworkAssistant_GILA_907:
		case CardIds.ClockworkAssistant_ONY_005ta11:
		case CardIds.ClockworkAssistantTavernBrawl_PVPDR_SCH_Active48:
		case CardIds.ClockworkAssistantTavernBrawl_PVPDR_Toki_T5:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ClockworkKnight:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.CloningDevice:
			return and(not(side(inputSide)), inDeck, minion);
		case CardIds.CloudSerpent_TLC_888:
			return and(side(inputSide), or(inHand, inDeck), or(elemental, dragon));
		case CardIds.ClutchOfCorruption_EDR_454:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.CoilCastingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), naga);
		case CardIds.CoilskarCommander:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ColdFeet:
			return and(not(side(inputSide)), or(inDeck, inHand), minion);
		case CardIds.ColiferoTheArtist_TOY_703:
			return and(side(inputSide), inDeck, minion);
		case CardIds.CollectorsIreTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, or(dragon, pirate, mech));
		case CardIds.Colossus_SC_758:
			return and(side(inputSide), or(inHand, inDeck), protoss, spell);
		case CardIds.CommanderSivara_TSC_087:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ConchsCall:
			return and(side(inputSide), inDeck, or(naga, spell));
		case CardIds.Concierge_VAC_463:
			return and(side(inputSide), or(inDeck, inHand), fromAnotherClass);
		case CardIds.Conductivity_YOG_522:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ConjuredBookkeeper_TLC_226:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ConnivingConman_VAC_333:
			return (input: SelectorInput): SelectorOutput => {
				const currentClassInfo = input.deckState.hero?.classes?.[0];
				const cardsPlayedFromAnotherClass = input.deckState.cardsPlayedThisMatch.filter(
					(c) =>
						!!allCards.getCard(c.cardId).classes?.length &&
						!allCards.getCard(c.cardId).classes.includes(CardClass[CardClass.NEUTRAL]) &&
						!allCards.getCard(c.cardId).classes.includes(CardClass[currentClassInfo]),
				);
				const lastCardPlayed = cardsPlayedFromAnotherClass.length
					? cardsPlayedFromAnotherClass[cardsPlayedFromAnotherClass.length - 1]
					: null;
				return highlightConditions(
					tooltip(
						and(
							side(inputSide),
							entityIs({ entityId: lastCardPlayed?.entityId, cardId: lastCardPlayed?.cardId }),
						),
					),
					and(side(inputSide), or(inDeck, inHand), fromAnotherClassStrict),
				)(input);
			};
		case CardIds.ConservatorNymph:
			return and(side(inputSide), or(inDeck, inHand), or(summonsTreant, isTreant));
		case CardIds.ConstructPylons_SC_755:
			return and(side(inputSide), or(inDeck, inHand), protoss);
		case CardIds.Consume_SC_020:
			return and(side(inputSide), or(inHand, inDeck), locationExtended);
		case CardIds.ContaminatedLasher_YOG_528:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ContrabandStash:
			return tooltip(and(side(inputSide), cardsPlayedThisMatch, fromAnotherClassStrict));
		case CardIds.CookiesLadleTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.Commencement:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ConcussiveShells_SC_411:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.CosmicKeyboard:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Cosmonaut_GDB_443:
			return and(side(inputSide), inDeck, spell);
		case CardIds.CostumedSinger:
			return and(side(inputSide), inDeck, secret);
		case CardIds.CorruptedFelstoneTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.CorruptTheWaters:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.CorsairCache:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.CountessAshmore:
			return highlightConditions(
				and(side(inputSide), inDeck, rush),
				and(side(inputSide), inDeck, lifesteal),
				and(side(inputSide), inDeck, deathrattle),
			);
		case CardIds.CowardlyGrunt:
			return and(side(inputSide), inDeck, minion);
		case CardIds.CowerInFear_TLC_823:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.CraneGame_TOY_884:
			return and(side(inputSide), inDeck, demon);
		case CardIds.CrashOfThunder:
			return and(side(inputSide), or(inHand, inDeck), spell, nature);
		case CardIds.CrazedConductor:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.BaritoneImp, CardIds.Crescendo));
		case CardIds.Crescendo:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.BaritoneImp, CardIds.CrazedConductor));
		case CardIds.CreationProtocol:
		case CardIds.CreationProtocol_CreationProtocolToken:
			return and(side(inputSide), inDeck, minion);
		case CardIds.CreatureOfTheSacredCave_TLC_430:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inDeck), holy, spell, cardsPlayedThisTurn),
				and(side(inputSide), or(inDeck, inDeck), holy, spell),
			);
		case CardIds.CreepTumor_SC_011:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.CrimsonCommander_GDB_722:
			return and(side(inputSide), or(inHand, inDeck), draenei);
		case CardIds.CrystallineGreatmace_GDB_231:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.CrystalStag:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		case CardIds.CrystalWelder_GDB_130:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.CrushclawEnforcer:
			return highlightConditions(
				and(side(inputSide), inDeck, naga),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
		case CardIds.CrystalsmithCultist:
			return and(side(inputSide), or(inDeck, inHand), spell, shadow);
		case CardIds.Crystology:
			return and(side(inputSide), inDeck, minion, attackLessThan(2), attackGreaterThan(0));
		case CardIds.CthunsChosen:
		case CardIds.CthunsChosen_WON_125:
		case CardIds.AncientShieldbearer:
		case CardIds.AncientShieldbearer_WON_111:
		case CardIds.BeckonerOfEvil:
		case CardIds.BladeOfCthun:
		case CardIds.BladeOfCthun_WON_075:
		case CardIds.CrazedWorshipper:
		case CardIds.CrazedWorshipper_WON_131:
		case CardIds.DarkArakkoa:
		case CardIds.DarkArakkoa_WON_304:
		case CardIds.DiscipleOfCthun:
		case CardIds.DiscipleOfCthun_WON_127:
		case CardIds.EyestalkOfCthun_WON_144:
		case CardIds.HoodedAcolyte:
		case CardIds.HoodedAcolyte_WON_313:
		case CardIds.KlaxxiAmberWeaver:
		case CardIds.KlaxxiAmberWeaver_WON_010:
		case CardIds.ThunderBluffValiant:
		case CardIds.ThunderBluffValiant_WON_085:
		case CardIds.TwilightGeomancer:
		case CardIds.TwilightGeomancer_WON_124:
		case CardIds.TwinEmperorVeklor:
		case CardIds.TwinEmperorVeklor_WON_134:
		case CardIds.UsherOfSouls:
		case CardIds.UsherOfSouls_WON_322:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				cardIs(CardIds.Cthun_WON_135, CardIds.Cthun_OG_279, CardIds.Cthun_OG_280),
			);
		// case CardIds.Cultivate:
		// 	return and(side(inputSide), inDeck, spell);
		case CardIds.Cultivation:
			return and(side(inputSide), or(inDeck, inHand), or(summonsTreant, isTreant));
		// case CardIds.CursedCatacombs_TLC_451:
		// 	return and(side(inputSide), inDeck, minion);
		case CardIds.CustomsEnforcer_VAC_440:
			return and(not(side(inputSide)), or(inDeck, inHand), notInInitialDeck);
		case CardIds.CutlassCourier:
			return and(side(inputSide), inDeck, pirate);
		case CardIds.UngoroBrochure_DalaranBrochureToken_WORK_050t:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.DangBlastedElemental_WW_397:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.DaringDrake:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.Darkbomb:
		case CardIds.Darkbomb_WON_095:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.DarkInquisitorXanesh:
			return and(side(inputSide), or(inDeck, inHand), or(corrupt, corrupted));
		case CardIds.NzothTheCorruptor_DarkMachinations_THD_039p:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.DarkmoonMagician_MIS_303:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Darkrider_EDR_456:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.DarkTemplar_SC_752:
			return and(side(inputSide), or(inHand, inDeck), templar);
		case CardIds.DaUndatakah:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), inGraveyard, minion, deathrattle),
			);
		case CardIds.DeadAir:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.DeadRinger:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.DealWithADevil:
			return and(side(inputSide), inDeck, minion);
		case CardIds.DeathBlossomWhomper:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.Deathchiller_RLK_083:
		case CardIds.Deathchiller_CORE_RLK_083:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.DeathGrowl:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.DeathlyDeathTavernBrawl:
			return and(side(inputSide), minion, deathrattle);
		case CardIds.DeathMetalKnight:
		case CardIds.DeathMetalKnight_CORE_ETC_523:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.DeathSpeakerBlackthorn_BAR_329:
			return and(side(inputSide), inDeck, minion, deathrattle, effectiveCostLess(6));
		case CardIds.DeathstriderTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.DeckOfChaos:
			return and(side(inputSide), inDeck, minion);
		case CardIds.DeckOfLunacy:
			return and(side(inputSide), inDeck, spell);
		case CardIds.DeepwaterEvoker:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Demonfuse:
		case CardIds.Demonfuse_WON_093:
		case CardIds.Demonfuse_DarkFusionEnchantment:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.DefenseAttorneyNathanos:
			return tooltip(and(side(inputSide), inGraveyard, minion, deathrattle));
		case CardIds.DesertNestmatron_WW_826:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.DetonationJuggernaut_WW_329:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.DeviateDreadfang:
			return and(side(inputSide), or(inDeck, inHand), nature, spell);
		case CardIds.DevilsaurMask_DINO_403:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.DevoutBlessingsTavernBrawlToken:
			return and(side(inputSide), inGraveyard, minion, deathrattle, minionsDeadSinceLastTurn);
		case CardIds.DevoutDungeoneer:
			return highlightConditions(and(side(inputSide), inDeck, holy, spell), and(side(inputSide), inDeck, spell));
		case CardIds.DevoutPupil:
			return and(side(inputSide), or(inHand, inDeck), spell, canTargetFriendlyCharacter);
		case CardIds.LesserDiamondSpellstone:
		case CardIds.LesserDiamondSpellstone_DiamondSpellstoneToken:
		case CardIds.LesserDiamondSpellstone_GreaterDiamondSpellstoneToken:
		case CardIds.LesserDiamondSpellstone_CORE_LOOT_507:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), inGraveyard, minion),
			);
		case CardIds.DigForTreasure_TOY_510:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, pirate),
				and(side(inputSide), inDeck, minion, minion),
			);
		case CardIds.DimensionalRipper:
			return and(side(inputSide), inDeck, minion);
		case CardIds.DinnerPerformer:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, effectiveCostLessThanRemainingMana),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.Dinositter_TLC_822:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.DirgeOfDespair:
			return and(side(inputSide), inDeck, demon, minion);
		case CardIds.DiscipleOfEonar:
			return and(side(inputSide), or(inDeck, inHand), chooseOne);
		case CardIds.DiscipleOfGolganneth:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.DisciplinarianGandling:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.DiscoMaul:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.DisksOfLegendTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, legendary);
		case CardIds.DispossessedSoul:
		case CardIds.DispossessedSoul_CORE_REV_901:
			return and(side(inputSide), or(inDeck, inHand), location);
		case CardIds.DiveTheGolakkaDepths_TLC_426:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.DivineIlluminationTavernBrawl:
			return and(side(inputSide), holy);
		case CardIds.DivineStar_GDB_460:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.DivingGryphon:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.DoorOfShadows:
		case CardIds.DoorOfShadows_DoorOfShadowsToken:
			return and(side(inputSide), inDeck, spell);
		case CardIds.DoubleAgent:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.DoubleJump_SCH_422:
			return and(side(inputSide), inDeck, outcast);
		case CardIds.DoubleTime:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.DozingKelpkeeper:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.DraconicDreamTavernBrawl:
			return and(side(inputSide), dragon);
		case CardIds.DraeneiTotemcarver_AT_047:
		case CardIds.DraeneiTotemcarver_CORE_AT_047:
			return and(side(inputSide), or(inHand, inDeck), totem);
		case CardIds.DragonAffinityTavernBrawl:
			return and(side(inputSide), dragon);
		case CardIds.DragonBreeder:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.DragonbloodTavernBrawl:
			return and(side(inputSide), dragon);
		case CardIds.DragonboneRitualTavernBrawl:
			return and(side(inputSide), dragon);
		case CardIds.Dragoncaster:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.DragonConsort:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.DragonGolem_WW_822:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.DragonsFury:
			return and(side(inputSide), inDeck, spell);
		case CardIds.DragonscaleArmaments_EDR_251:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, inInitialDeck),
				and(side(inputSide), inDeck, spell, notInInitialDeck),
			);
		case CardIds.DragonTurtle_FIR_956:
			return and(side(inputSide), or(inDeck, inHand), darkGift);
		case CardIds.DrakkariEmbalmer_RLK_119:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.DrakonidOperative:
		case CardIds.DrakonidOperativeCore:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.DrBoomMadGenius:
			return and(side(inputSide), or(inHand, inDeck), mech);
		case CardIds.DreadRaptor_TLC_432:
			return and(side(inputSide), or(inHand, inDeck), deathrattle, minion, effectiveCostLess(4));
		case CardIds.DreamboundDisciple_EDR_847:
			return and(side(inputSide), or(inHand, inDeck), imbue);
		case CardIds.DreamboundRaptor_EDR_849:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Dreamwarden_EDR_256:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.Drekthar_AV_100:
			return !card ? null : and(side(inputSide), inDeck, minion, effectiveCostLess(card.getEffectiveManaCost()));
		case CardIds.DrocomurchanicasTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, or(dragon, murloc, mech));
		case CardIds.DryscaleDeputy_WW_383:
			return and(side(inputSide), inDeck, spell);
		case CardIds.DunBaldarBunker:
			return and(side(inputSide), inDeck, secret);
		case CardIds.DynOMatic:
		case CardIds.DynOMaticCore:
			return and(side(inputSide), or(inHand, inDeck), minion, mech);
		case CardIds.EaglehornBowLegacy:
		case CardIds.EaglehornBowVanilla:
			return and(side(inputSide), or(inDeck, inHand), secret);
		case CardIds.EchoOfMedivh:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.EdgeOfDredgeTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), dredge);
		case CardIds.EerieStoneTavernBrawl:
			return and(side(inputSide), spell, shadow);
		case CardIds.ElementalAllies:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), elemental),
				and(side(inputSide), inDeck, spell),
			);
		case CardIds.ElementalEvocation:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.AlakirTheWindlord_ElementalEvocation_THD_026p:
			return and(side(inputSide), or(inHand, inDeck), elemental, legendary);
		case CardIds.ElementaryReaction:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.ElderNadox:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.EliseBadlandsSavior_WW_392:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ElitistSnob:
			return and(side(inputSide), inHand, paladin);
		case CardIds.ElixirOfVigorTavernBrawl:
			return and(side(inputSide), minion);
		case CardIds.ElvenMinstrel:
		case CardIds.ElvenMinstrelCore:
			return and(side(inputSide), inDeck, minion);
		case CardIds.EmberrootDestroyer_FIR_955:
			return and(side(inputSide), or(inHand, inDeck), selfDamageHero);
		case CardIds.Embiggen:
			return and(side(inputSide), inDeck, minion);
		case CardIds.EmbraceOfNature:
		case CardIds.EmbraceOfNature_EmbraceOfNatureToken:
			return and(side(inputSide), inDeck, chooseOne);
		case CardIds.Endgame_TOY_886:
			return (input: SelectorInput): SelectorOutput => {
				const deadDemons =
					input.deckState?.minionsDeadThisMatch?.filter(
						(card) =>
							allCards.getCard(card?.cardId).races?.includes(Race[Race.DEMON]) ||
							allCards.getCard(card?.cardId).races?.includes(Race[Race.ALL]),
					) ?? [];

				const last = deadDemons[deadDemons.length - 1];
				if (!last) {
					return and(side(inputSide), or(inHand, inDeck), demon)(input);
				}
				return highlightConditions(
					and(side(inputSide), or(inHand, inDeck), demon),
					tooltip(
						and(
							side(inputSide),
							inGraveyard,
							minion,
							demon,
							entityIs({ entityId: last.entityId, cardId: last.cardId }),
						),
					),
				)(input);
			};
		case CardIds.EndbringerUmbra_TLC_106:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, deathrattle),
				and(side(inputSide), inGraveyard, minion, deathrattle),
			);
		case CardIds.EnduranceTrainingTavernBrawl:
			return and(side(inputSide), minion, taunt);
		case CardIds.EnergyShaper:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.EnvoyOfTheGlade_EDR_873:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.EscapeTheUnderfel_TLC_446:
		case CardIds.EscapeTheUnderfel_UnderfelRiftToken_TLC_446t:
		case CardIds.EscapeTheUnderfel_UnderfelRiftToken_TLC_446t1:
			return and(side(inputSide), or(inHand, inDeck), generatesTemporaryCard);
		case CardIds.Ensmallen_TOY_805:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ErodedSediment_WW_428:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.EternalLayover_WORK_028:
			return and(side(inputSide), or(inDeck, inHand), generateCorpse);
		case CardIds.EternalServitude_CORE_ICC_213:
		case CardIds.EternalServitude_ICC_213:
			return and(side(inputSide), inGraveyard, minion);
		case CardIds.EtherealOracle_GDB_310:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, damage),
				and(side(inputSide), inDeck, spell),
			);
		case CardIds.Eureka:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.EvolutionChamber_SC_021:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, zerg),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.ExarchOthaar_GDB_856:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.ExoticHoundmaster_EDR_226:
			return and(side(inputSide), inDeck, beast);
		case CardIds.ExpeditedBurialTavernBrawl:
			return and(side(inputSide), minion, deathrattle);
		case CardIds.ExpeditionSergeant_GDB_229:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.FaeTrickster_EDR_571:
			return and(side(inputSide), inDeck, spell, costMore(4));
		case CardIds.FairyTaleForest_TOY_507:
			return and(side(inputSide), inDeck, minion, battlecry);
		case CardIds.Falric_CORE_EDR_003:
			return and(side(inputSide), inDeck, spendCorpse);
		case CardIds.FaithfulCompanions:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.FancyPackaging_TOY_881:
			return and(side(inputSide), or(inHand, inDeck), minion, divineShield);
		case CardIds.FandralStaghelm_CORE_OG_044:
		case CardIds.FandralStaghelm_OG_044:
			return and(side(inputSide), inDeck, chooseOne);
		case CardIds.FangboundDruid:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.FarseerNobundo_GDB_447:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.FateSplitter:
			return (input: SelectorInput): SelectorOutput => {
				const lastCardPlayed =
					input.deckState?.cardsPlayedThisMatch?.[input.deckState.cardsPlayedThisMatch.length - 1];
				return tooltip(
					and(
						opposingSide(inputSide),
						entityIs({ entityId: lastCardPlayed?.entityId, cardId: lastCardPlayed?.cardId }),
					),
				)(input);
			};
		case CardIds.FeldoreiWarband:
			return and(side(inputSide), inDeck, minion);
		case CardIds.FelfireBlaze_FIR_904:
			return and(side(inputSide), or(inHand, inDeck), fel, spell);
		case CardIds.FelfireBonfire_VAC_952:
			return and(side(inputSide), or(inHand, inDeck), minion, deathrattle);
		case CardIds.FelfireInTheHole:
			return highlightConditions(and(side(inputSide), inDeck, spell, fel), and(side(inputSide), inDeck, spell));
		case CardIds.FerociousFelbat_EDR_892:
			return and(side(inputSide), or(inHand, inDeck), minion, deathrattle, effectiveCostMore(4));
		case CardIds.KaelthasSunstrider_FelFueled_THD_043p:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
		case CardIds.Felgorger_SW_043:
			return and(side(inputSide), inDeck, spell, fel);
		case CardIds.IllidanStormrage_FelInside_THD_004p:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.IxlidFungalLord:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Felosophy:
			return and(side(inputSide), or(inHand, inDeck), demon);
		case CardIds.FelscaleEvoker:
			return highlightConditions(
				and(side(inputSide), inDeck, demon, not(cardIs(CardIds.FelscaleEvoker))),
				and(side(inputSide), or(inDeck, inHand), spell),
			);
		case CardIds.Fetch_TOY_352:
			return highlightConditions(
				and(side(inputSide), inDeck, beast),
				and(side(inputSide), inDeck, minion),
				and(side(inputSide), inDeck, spell),
			);
		case CardIds.FieldContact:
			return and(side(inputSide), or(inHand, inDeck), or(battlecry, combo));
		case CardIds.FierceOutsider:
			return and(side(inputSide), or(inHand, inDeck), outcast);
		case CardIds.FinjaTheFlyingStar:
		case CardIds.FinjaTheFlyingStar_CORE_CFM_344:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.FireBreath_DINO_406:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.Firegill_DINO_404:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.FirekeepersIdolTavernBrawl:
			return and(side(inputSide), spell, fire);
		case CardIds.FirePlumeHarbinger:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.FirePlumesHeart:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.FiremancerFlurgl:
			return and(side(inputSide), race(Race.MURLOC), or(inDeck, inHand));
		case CardIds.FlameRevenant:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.FlamesOfTheFirelord_FIR_923:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostMore(7));
		case CardIds.FlamesOfTheKirinTorTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, fire);
		case CardIds.FlameWavesTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, fire);
		case CardIds.FlashSale_TOY_716:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.FleshBehemoth_RLK_830:
		case CardIds.FleshBehemoth_RLK_Prologue_RLK_830:
			return and(side(inputSide), inDeck, minion, undead, not(cardIs(CardIds.FleshBehemoth_RLK_830)));
		case CardIds.FlickeringLightbot_MIS_918:
		case CardIds.FlickeringLightbot_FlickeringLightbotToken_MIS_918t:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.FlightOfTheFirehawk_TLC_222:
			return and(side(inputSide), inDeck, minion, not(tribeless));
		case CardIds.Flowrider:
			return highlightConditions(
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), or(inDeck, inHand), overload),
			);
		case CardIds.FlyOffTheShelves_TOY_714:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.Foamrender_MIS_101:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.FogsailFreebooterCore:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.FoodFight_VAC_533:
		case CardIds.FoodFight_EntréeToken_VAC_533t:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ForebodingFlame_GDB_121:
			return and(side(inputSide), or(inDeck, inHand), demon, notInInitialDeck);
		case CardIds.ForsakenLieutenant_AV_601:
			return and(side(inputSide), or(inDeck, inHand), deathrattle, minion);
		case CardIds.ForgedInFlame:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.FossilFanatic:
			return and(side(inputSide), inDeck, spell, fel);
		case CardIds.FoxyFraud:
		case CardIds.FoxyFraud_CORE_DMF_511:
			return and(side(inputSide), or(inHand, inDeck), combo);
		case CardIds.FreeAdmission:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, demon),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.FrequencyOscillator:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.PeacefulPiper_FriendlyFace:
			return and(side(inputSide), inDeck, beast);
		case CardIds.Pelagos_CORE_REV_250:
		case CardIds.Pelagos_REV_250:
		case CardIds.Pelagos_REV_781:
			return and(side(inputSide), or(inHand, inDeck), spell, canTargetFriendlyCharacter);
		case CardIds.FrizzKindleroost:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.FrostburnMatriarch_FIR_901:
			return and(side(inputSide), or(inHand, inDeck), darkGift);
		case CardIds.FrostLichJaina_ICC_833:
		case CardIds.FrostLichJaina_CORE_ICC_833:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.FrontLines_TID_949:
		case CardIds.FrontLines_Story_11_FrontLines:
			return and(side(inputSide), inDeck, minion);
		case CardIds.FrostfinChomper:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.FrostweaveDungeoneer:
			return highlightConditions(and(side(inputSide), inDeck, frost, spell), and(side(inputSide), inDeck, spell));
		case CardIds.FungalFortunes:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Funkfin:
			return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
		case CardIds.FutureEmissary_WON_140:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.GaiaTheTechtonic_TSC_029:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.TheGalacticProjectionOrb_TOY_378:
			return (input: SelectorInput): SelectorOutput => {
				const spellsPlayed = input.deckState?.spellsPlayedThisMatch;
				if (!spellsPlayed) {
					return null;
				}

				const groupedByCost = groupByFunction((c: DeckCard) => c.refManaCost)(spellsPlayed);
				const firstOfEachCost = Object.keys(groupedByCost)
					.sort()
					.map((key) => groupedByCost[key][0])
					.map((c) => ({ entityId: c.entityId, cardId: c.cardId }));
				return highlightConditions(
					tooltip(and(side(inputSide), entityIs(...firstOfEachCost))),
					and(side(inputSide), spellPlayedThisMatch),
					and(side(inputSide), or(inHand, inDeck), spell),
				)(input);
			};
		case CardIds.GameMasterNemsy_TOY_524:
			return and(side(inputSide), inDeck, demon);
		case CardIds.GatherYourParty:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Gazlowe:
			return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostEqual(1));
		case CardIds.GhastlyGravedigger:
			return and(side(inputSide), or(inDeck, inHand), secret);
		case CardIds.Ghost_SC_408:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.GhoulishAlchemist:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				cardIs(
					CardIds.GhoulishAlchemist_SlimyConcoctionToken,
					CardIds.GhoulishAlchemist_DreadfulConcoctionToken,
					CardIds.GhoulishAlchemist_BubblingConcoctionToken,
					CardIds.GhoulishAlchemist_HazyConcoctionToken,
					CardIds.GhoulishAlchemist_GleamingConcoctionToken,
					CardIds.Concoctor,
					CardIds.PotionBelt,
					CardIds.VileApothecary,
					CardIds.PotionmasterPutricide,
					CardIds.ContagionConcoctionTavernBrawl,
				),
			);
		case CardIds.GiantAnaconda:
			return and(side(inputSide), or(inDeck, inHand), minion, attackGreaterThan(4));
		case CardIds.Gigantotem:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.GiftwrappedWhelp_TOY_386:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.GladesongSiren_TLC_819:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), holy, spell),
				and(side(inputSide), or(inDeck, inHand), shadow, spell),
			);
		case CardIds.Glaivetar:
			return and(side(inputSide), inDeck, outcast);
		case CardIds.GlowflySwarm:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.GluthSicleTavernBrawl:
			return and(side(inputSide), inDeck, minion, undead);
		case CardIds.GluthTavernBrawl_PVPDR_Sai_T1:
			return and(side(inputSide), or(inDeck, inHand), minion, undead);
		case CardIds.GlacialAdvance_RLK_512:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.GlacialDownpourTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, frost);
		case CardIds.GoboglideTech:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.Goldrinn_EDR_480:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.GolgannethTheThunderer:
			return highlightConditions(
				and(side(inputSide), inDeck, overload),
				and(side(inputSide), or(inDeck, inHand), spell),
			);
		case CardIds.GorillabotA3:
		case CardIds.GorillabotA3Core:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				minion,
				mech,
				not(entityIs({ entityId: card?.entityId, cardId: card?.cardId })),
			);
		case CardIds.GorlocRavager:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.GraniteForgeborn:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.GrandMagisterRommath:
			return tooltip(and(side(inputSide), cardsPlayedThisMatch, spell, notInInitialDeck));
		case CardIds.GraveDefiler:
			return and(side(inputSide), inDeck, spell, fel);
		case CardIds.GraveDigging:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.GreedyPartner_WW_901:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(2));
		case CardIds.GreedyGainsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.GreenThumbGardener:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.GreySageParrot:
			return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostMore(5));
		case CardIds.Grillmaster_VAC_917:
			return (input: SelectorInput): SelectorOutput => {
				if (!input.deckState.deck?.length) {
					return null;
				}

				const highestCost = Math.max(...input.deckState.deck.map((c) => c?.getEffectiveManaCost() ?? 0));
				const lowestCost = Math.min(
					...input.deckState.deck.map((c) => c?.getEffectiveManaCost()).filter((cost) => cost != null),
				);

				return highlightConditions(
					and(side(inputSide), inDeck, effectiveCostEqual(lowestCost)),
					and(side(inputSide), inDeck, effectiveCostEqual(highestCost)),
				)(input);
			};
		case CardIds.GrimestreetOutfitter:
		case CardIds.GrimestreetOutfitterCore:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.GrimtotemBuzzkill:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.GrimyGadgeteer:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.GrizzledGuardian:
			return and(side(inputSide), inDeck, minion, effectiveCostLess(5));
		case CardIds.GrommashsArmguardsTavernBrawl:
			return and(side(inputSide), weapon);
		case CardIds.GrotesqueRuneblade_EDR_812:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), unholyRune),
				and(side(inputSide), or(inHand, inDeck), bloodRune),
			);
		case CardIds.Groundskeeper:
			return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostMore(4));
		case CardIds.GroveShaper_EDR_271:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.GuardianAnimals:
			return and(side(inputSide), inDeck, minion, beast, effectiveCostLess(6));
		case CardIds.GuardianLightTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.GuessTheWeight_Less:
			return (input: SelectorInput): boolean => {
				if (!input.deckState.hand.length) {
					return null;
				}
				const lastDrawnCard = input.deckState.hand[input.deckState.hand.length - 1];
				return (
					side(inputSide)(input) &&
					inDeck(input) &&
					effectiveCostLess(lastDrawnCard?.getEffectiveManaCost() ?? 0)(input)
				);
			};
		case CardIds.GuessTheWeight_More:
			return (input: SelectorInput): boolean => {
				if (!input.deckState.hand.length) {
					return null;
				}
				const lastDrawnCard = input.deckState.hand[input.deckState.hand.length - 1];
				return (
					side(inputSide)(input) &&
					inDeck(input) &&
					effectiveCostMore(lastDrawnCard?.getEffectiveManaCost() ?? 0)(input)
				);
			};
		case CardIds.GuffRunetotem_BAR_720:
			return and(side(inputSide), spell, spellSchool(SpellSchool.NATURE));
		case CardIds.GuidingFigure_GDB_106:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
		case CardIds.GuitarSoloist:
			return highlightConditions(
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), inDeck, minion),
				and(side(inputSide), inDeck, weapon),
			);
		case CardIds.Gyreworm:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.HabeasCorpses:
			return and(side(inputSide), inGraveyard, minion);
		case CardIds.HagathasEmbrace:
		case CardIds.HagathasEmbraceTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.HagathaTheFabled_TOY_504:
			return and(side(inputSide), inDeck, spell, effectiveCostMore(4));
		case CardIds.HallazealTheAscended:
		case CardIds.HallazealTheAscended_WON_336:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.Hallucination_SC_757:
			return and(side(inputSide), or(inHand, inDeck), protoss, minion);
		case CardIds.HalduronBrightwing:
			return and(side(inputSide), inDeck, spell, arcane);
		case CardIds.Hadronox_CORE_ICC_835:
		case CardIds.Hadronox_ICC_835:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, taunt),
				and(side(inputSide), inGraveyard, minion, taunt),
			);
		case CardIds.HamuulRunetotem_EDR_845:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, not(nature)),
				and(side(inputSide), inDeck, spell, nature),
			);
		case CardIds.Handmaiden:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.HarbingerOfWinterCore_RLK_511:
			return and(side(inputSide), inDeck, spell, frost);
		case CardIds.HarborScamp:
			return and(side(inputSide), inDeck, pirate);
		case CardIds.HarmonicMetal:
		case CardIds.HarmonicMetal_DissonantMetalToken:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.HarnessTheElementsTavernBrawl:
			return and(side(inputSide), inDeck, spell);
		case CardIds.HarpoonGun:
			return and(side(inputSide), inDeck, beast);
		case CardIds.HarrowingOx_WW_356:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.HatcheryHelper_TLC_233:
			return and(side(inputSide), or(inDeck, inHand), minion, attackLessThan(3));
		case CardIds.HatchingCeremony_DINO_405:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.HawkstriderRancher:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.HealingWave:
		case CardIds.HealingWave_WON_320:
			return and(side(inputSide), inDeck, minion);
		case CardIds.HedgeMaze_REV_333:
		case CardIds.HedgeMaze_REV_792:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.HedraTheHeretic_TSC_658:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.Hellion_SC_412:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion),
				and(side(inputSide), or(inDeck, inHand), starshipExtended),
			);
		case CardIds.Hellion_HellbatToken_SC_412t:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.HemetFoamMarksman_TOY_355:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.HemetJungleHunter:
			return and(side(inputSide), inDeck, effectiveCostMore(3));
		case CardIds.HenchClanThug:
		case CardIds.HenchClanThugCore:
			return and(side(inputSide), or(inHand, inDeck), givesHeroAttack);
		case CardIds.HeraldOfChaos:
			return and(side(inputSide), or(inHand, inDeck), spell, fel);
		case CardIds.HeraldOfFlame_TRLA_176:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.HeraldOfLight:
			return and(side(inputSide), or(inHand, inDeck), spell, holy);
		case CardIds.HeraldOfLokholar:
			return and(side(inputSide), inDeck, spell, frost);
		case CardIds.HeraldOfNature:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.HeraldOfShadows:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.HerbivoreAssistant_DINO_419:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.HighAbbessAlura:
			return and(side(inputSide), inDeck, spell);
		case CardIds.HighCultistBasaleph:
			return tooltip(and(side(inputSide), minionsDeadSinceLastTurn, undead));
		case CardIds.HighCultistHerenn_TLC_810:
			return and(side(inputSide), inDeck, deathrattle, minion);
		case CardIds.HighTemplar_SC_765:
			return and(side(inputSide), or(inHand, inDeck), templar);
		case CardIds.HiHoSilverwing_WW_344:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.HoldTheLineTavernBrawl:
			return and(side(inputSide), taunt);
		case CardIds.HollowDirehorn_DINO_416:
			return and(side(inputSide), or(inDeck, inHand), generateCorpse);
		case CardIds.HolyCowboy_WW_335:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.HolyEggbearer_DINO_411:
			return and(side(inputSide), or(inHand, inDeck), attackIs(0), minion);
		case CardIds.HolyGlowsticks_MIS_709:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.Hookfist3000:
		case CardIds.Hookfist3000_CORE_NX2_028:
			return and(side(inputSide), or(inDeck, inHand), givesHeroAttack);
		case CardIds.HopeOfQuelthalas:
			return and(side(inputSide), or(inDeck, inHand, inPlay), minion);
		case CardIds.HornOfWrathion:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.HotSpringGlider_TLC_428:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.HotStreak:
			return and(side(inputSide), or(inDeck, inHand), spell, fire);
		case CardIds.HozenRoughhouser_VAC_938:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.Hullbreaker:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Hybridization_TLC_236:
			return and(side(inputSide), or(inDeck, inHand), minion, and(effectiveCostMore(0), effectiveCostLess(5)));
		case CardIds.Hydralisk_SC_008:
			return and(side(inputSide), or(inDeck, inHand), zerg);
		case CardIds.HydrationStation_VAC_948:
			return (input: SelectorInput): SelectorOutput => {
				const candidates = input.deckState.minionsDeadThisMatch
					.filter((c) => hasTaunt(c.cardId, c.entityId, input.deckState, allCards))
					.filter((c) => getProcessedCard(c.cardId, c.entityId, input.deckState, allCards).cost != null)
					.sort(
						sortByProperties((c) => [
							-getProcessedCard(c.cardId, c.entityId, input.deckState, allCards).cost,
						]),
					);
				let finalCandidates = [];
				if (!!candidates?.length) {
					// First remove duplicate cardIds
					const withoutDuplicates = candidates.filter(
						(c, index) => candidates.findIndex((c2) => c2.cardId === c.cardId) === index,
					);
					const targets = withoutDuplicates.slice(0, 3);
					const lowestCostTarget = targets[targets.length - 1];
					const lowestCostDeckCard = input.deckState.findCard(lowestCostTarget.entityId)?.card;
					const lowestCost = getCost(lowestCostDeckCard, input.deckState, allCards);
					finalCandidates = candidates.filter(
						(c) => getProcessedCard(c.cardId, c.entityId, input.deckState, allCards).cost >= lowestCost,
					);
				}
				return highlightConditions(
					tooltip(
						and(
							side(inputSide),
							entityIs(...finalCandidates.map((c) => ({ entityId: c.entityId, cardId: c.cardId }))),
						),
					),
					and(side(inputSide), or(inHand, inDeck, inPlay), taunt, minion),
				)(input);
			};
		case CardIds.IcebloodTower:
			return and(side(inputSide), inDeck, spell);
		case CardIds.IceFishing_CORE_ICC_089:
		case CardIds.IceFishing_ICC_089:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.IceRevenant:
			return and(side(inputSide), inDeck, spell, frost);
		case CardIds.IllidariStudiesCore:
		case CardIds.IllidariStudies_YOP_001:
			return and(side(inputSide), or(inHand, inDeck), outcast);
		case CardIds.Illuminate:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Kazakus_IchorOfUndeathToken_CFM_621t37:
		case CardIds.Kazakus_IchorOfUndeathToken_CFM_621t38:
		case CardIds.Kazakus_IchorOfUndeathToken_CFM_621t39:
			return highlightConditions(
				and(side(inputSide), inGraveyard, minion),
				and(side(inputSide), or(inHand, inDeck), minion),
			);
		case CardIds.IdolsOfEluneTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.IngeniousArtificer_GDB_135:
			return and(side(inputSide), or(inHand, inDeck), draenei);
		case CardIds.IgnisTheEternalFlame:
			return and(side(inputSide), or(inDeck, inHand), forge);
		case CardIds.ImpCredibleTrousersTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.ImployeeOfTheMonth_WORK_009:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ImprisonedScrapImp:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.IncantersFlow:
			return and(side(inputSide), inDeck, spell);
		case CardIds.InfantryReanimator:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), undead),
				and(side(inputSide), inGraveyard, undead),
			);
		case CardIds.InfernoHerald_FIR_913:
			return and(side(inputSide), or(inHand, inDeck), spell, fire);
		case CardIds.InfernalStratagem_GDB_122:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.Infestor_SC_002:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.IniStormcoil_TSC_649:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.CoralKeeper:
		case CardIds.Multicaster:
		case CardIds.Sif:
		case CardIds.DiscoveryOfMagic:
		case CardIds.ElementalInspiration:
		case CardIds.InquisitiveCreation:
		case CardIds.WisdomOfNorgannon:
		case CardIds.RazzleDazzler_VAC_301:
			return and(side(inputSide), or(inDeck, inHand), spell, hasSpellSchool, not(spellSchoolPlayedThisMatch));
		case CardIds.Insight:
		case CardIds.Insight_InsightToken:
			return and(side(inputSide), inDeck, minion);
		case CardIds.InspiringPresenceTavernBrawl:
			return and(side(inputSide), minion, legendary);
		case CardIds.InstrumentTech:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.InterstellarResearcher_GDB_728:
			return and(side(inputSide), inDeck, libram);
		case CardIds.InterstellarStarslicer_GDB_726:
			return and(side(inputSide), or(inHand, inDeck), libram);
		case CardIds.InterstellarWayfarer_GDB_721:
			return and(side(inputSide), or(inHand, inDeck), libram);
		case CardIds.IntoTheFray:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.InventorBoom_TOY_607:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), mech, effectiveCostMore(4)),
				tooltip(and(side(inputSide), inGraveyard, mech, effectiveCostMore(4))),
			);
		case CardIds.InventorsAura:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.InvestmentOpportunity:
			return and(side(inputSide), inDeck, overload);
		case CardIds.InvigoratingLightTavernBrawl:
			return and(side(inputSide), spell, holy);
		case CardIds.InvigoratingSermon:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Invincible:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.Inzah:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.IronRootsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.ItsRainingFin:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.JaceDarkweaver:
			return highlightConditions(
				tooltip(and(side(inputSide), spellPlayedThisMatch, spellSchool(SpellSchool.FEL))),
				and(side(inputSide), or(inDeck, inHand), spell, fel),
			);
		case CardIds.JazzBass:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.JepettoJoybuzz:
			return and(side(inputSide), inDeck, minion);
		case CardIds.JerryRigCarpenter:
			return and(side(inputSide), inDeck, spell, chooseOne);
		case CardIds.JewelOfNzoth:
			return and(side(inputSide), minion, inGraveyard, deathrattle);
		case CardIds.JimRaynor_SC_400:
		case CardIds.Thor_ThorExplosivePayloadToken_SC_414t:
			return (input: SelectorInput): SelectorOutput => {
				// const starships = input.deckState
				// 	.getAllCardsInDeckWithoutOptions()
				// 	.filter((c) => input.allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.STARSHIP]))
				// 	.filter((c) => !c.tags?.some((t) => t.Name === GameTag.LAUNCHPAD && t.Value === 1));
				// const entityIds = starships.flatMap((c) => [
				// 	{ cardId: c.cardId, entityId: c.entityId },
				// 	...(c.storedInformation?.cards
				// 		.filter((c) => allCards.getCard(c?.cardId).mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]))
				// 		?.map((c) => ({ cardId: c.cardId, entityId: c.entityId })) ?? []),
				// ]);
				return highlightConditions(
					// tooltip(
					// 	and(
					// 		side(inputSide),
					// 		entityIs(...entityIds.map((c) => ({ entityId: c.entityId, cardId: c.cardId }))),
					// 	),
					// ),
					and(side(inputSide), or(inHand, inDeck), starshipExtended),
				)(input);
			};
		case CardIds.Jitterbug:
			return and(side(inputSide), or(inHand, inDeck), divineShield);
		case CardIds.JotunTheEternal:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.JoymancerJepetto_TOY_960:
			return highlightConditions(
				tooltip(and(side(inputSide), minionPlayedThisMatch, or(attackIs(1), healthIs(1)))),
				and(side(inputSide), or(inDeck, inHand), or(attackIs(1), healthIs(1))),
			);
		case CardIds.JuicyPsychmelon:
			return and(
				side(inputSide),
				inDeck,
				minion,
				or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
			);
		case CardIds.JungleGym_TOY_359:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.JungleJammer:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.K90tron:
			return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
		case CardIds.KabalCrystalRunner:
		case CardIds.KabalCrystalRunner_WON_308:
			return and(side(inputSide), or(inHand, inDeck), secret);
		case CardIds.KabalTalonpriest:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.KalimosPrimalLord:
		case CardIds.KalimosPrimalLord_Core_UNG_211:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.KangorsEndlessArmy:
			return and(side(inputSide), inGraveyard, mech);
		case CardIds.KanrethadEbonlocke_KanrethadPrimeToken:
			return and(side(inputSide), demon, inGraveyard, minion);
		case CardIds.KaraTheDarkStar_GDB_127:
			return and(side(inputSide), or(inHand, inDeck), spell, shadow);
		case CardIds.KathrenaWinterwisp:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.Kazakusan_ONY_005:
			return and(side(inputSide), or(inDeck, cardsPlayedThisMatch), minion, dragon);
		case CardIds.Khazgoroth:
		case CardIds.Khazgoroth_TitanforgeToken:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.KhadgarsScryingOrb:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.KeeneyeSpotter:
			return and(side(inputSide), or(inDeck, inHand), givesHeroAttack);
		case CardIds.KeeperOfFlame_FIR_928:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.KeepersStrength_YOG_509:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.KelthuzadTheInevitable_REV_514:
		case CardIds.KelthuzadTheInevitable_REV_786:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				cardIs(
					CardIds.VolatileSkeleton,
					CardIds.KelthuzadTheInevitable_REV_514,
					CardIds.KelthuzadTheInevitable_REV_786,
					CardIds.ColdCase,
					CardIds.Deathborne,
					CardIds.NightcloakSanctum_REV_602,
					CardIds.NightcloakSanctum_REV_796,
					CardIds.BrittleBonesTavernBrawl,
				),
			);
		case CardIds.Kindle_DALA_911:
		case CardIds.Kindle_ULDA_911:
			return and(side(inputSide), inDeck, spell);
		case CardIds.KindlingElemental:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.KindlingFlameTavernBrawl:
			return and(side(inputSide), spell, fire, dealsDamage);
		case CardIds.KingOfBeasts:
		case CardIds.KingOfBeasts_WON_162:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.KingpinPud_WW_421:
			return and(
				side(inputSide),
				or(inDeck, inHand, inGraveyard),
				cardIs(CardIds.OgreGangOutlaw_WW_418, CardIds.OgreGangRider_WW_419, CardIds.OgreGangAce_WW_420),
			);
		case CardIds.KingKrush_KingsDecree_THD_012p:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), spell),
				and(side(inputSide), or(inDeck, inHand), beast),
			);
		case CardIds.KingTide_VAC_524:
			return and(or(inDeck, inHand), spell);
		case CardIds.KnightOfAnointment:
			return and(side(inputSide), inDeck, spell, spellSchool(SpellSchool.HOLY));
		case CardIds.KnightOfTheWild:
		case CardIds.KnightOfTheWild_WON_003:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.Knockback_TLC_517:
			return and(side(inputSide), or(inHand, inDeck), shufflesCardIntoDeck);
		case CardIds.KoboldMiner_TheAzeriteRatToken_WW_001t26:
			return (input: SelectorInput): SelectorOutput => {
				if (!input.deckState.minionsDeadThisMatch?.length) {
					return null;
				}

				const highestCost = Math.max(
					...input.deckState.minionsDeadThisMatch.map((c) => allCards.getCard(c.cardId).cost ?? 0),
				);
				const candidates = input.deckState.minionsDeadThisMatch.filter(
					(c) => allCards.getCard(c.cardId).cost === highestCost,
				);
				if (!candidates.length) {
					return null;
				}

				return highlightConditions(
					tooltip(
						and(
							side(inputSide),
							inGraveyard,
							minion,
							entityIs(...candidates.map((c) => ({ entityId: c.entityId, cardId: c.cardId }))),
						),
					),
				)(input);
			};
		case CardIds.KolkarPackRunner:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.KureTheLightBeyond_GDB_442:
			return and(side(inputSide), or(inHand, inDeck), spell, holy);
		case CardIds.LadyAnacondra_WC_006:
			return and(side(inputSide), spell, spellSchool(SpellSchool.NATURE));
		case CardIds.LadyAshvane_TSC_943:
		case CardIds.LadyAshvane_Story_11_LadyAshvane:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.LadyDarkvein:
		case CardIds.LadyDarkvein_CORE_REV_373:
			return and(side(inputSide), or(inHand, inDeck), spell, shadow);
		case CardIds.LadyDeathwhisper_RLK_713:
			return and(side(inputSide), or(inHand, inDeck), spell, frost);
		case CardIds.LadyInWhite:
			return and(side(inputSide), inDeck, minion);
		case CardIds.LadyLiadrin:
		case CardIds.LadyLiadrin_CORE_BT_334:
			return tooltip(and(side(inputSide), spellPlayedThisMatchOnFriendly));
		case CardIds.LadyNazjar_TID_709:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, fire),
				and(side(inputSide), or(inHand, inDeck), spell, frost),
				and(side(inputSide), or(inHand, inDeck), spell, arcane),
			);
		case CardIds.LadyStheno_TSC_218:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.LadyVashj_VashjPrimeToken:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Lamplighter_VAC_442:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.LaserBarrage_GDB_845:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.LastStand:
			return and(side(inputSide), inDeck, taunt);
		case CardIds.LeadDancer:
			// TODO: implement current attack
			return and(inDeck, minion, attackLessThan(4));
		case CardIds.LearnDraconic:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.LeylineManipulator:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
		case CardIds.LibramOfClarity_GDB_137:
			return highlightConditions(
				and(side(inputSide), inDeck, minion),
				and(side(inputSide), inDeck, libramDiscount),
			);
		case CardIds.LibramOfDivinity_GDB_138:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LibramOfFaith_GDB_139:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LibramOfJustice_BT_011:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LibramOfJudgment:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LibramOfHope:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LibramOfWisdom_BT_025:
			return and(side(inputSide), inDeck, libramDiscount);
		case CardIds.LifebindersGift:
		case CardIds.LifebindersGrowth:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.Lifeguard_VAC_919:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.LiftOff_SC_410:
			return and(side(inputSide), or(inHand, inDeck), terran);
		case CardIds.LightOfTheNewMoon_FIR_918:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
		case CardIds.LightmawNetherdrake:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), holy, spell),
				and(side(inputSide), or(inHand, inDeck), shadow, spell),
			);
		case CardIds.Lightray:
			return and(side(inputSide), or(inHand, inDeck), paladin);
		case CardIds.Lightspeed_GDB_457:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.LilypadLurker:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.LinaShopManager_TOY_531:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.LinedancePartner_WW_433:
			return and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(3));
		case CardIds.LineHopper:
			return and(side(inputSide), outcast);
		case CardIds.LivingFlame_FIR_929:
			return and(side(inputSide), inDeck, spell, fire);
		case CardIds.LivingGarden_EDR_518:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.LivingPrairie_WW_024:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.LivingSeedRank1:
		case CardIds.LivingSeedRank1_LivingSeedRank2Token:
		case CardIds.LivingSeedRank1_LivingSeedRank3Token:
			return and(side(inputSide), inDeck, beast);
		case CardIds.LoadTheChamber_WW_409:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), naga),
				and(side(inputSide), or(inDeck, inHand), and(fel, spell)),
				and(side(inputSide), or(inDeck, inHand), weapon),
			);
		case CardIds.LockAndLoad_AT_061:
		case CardIds.LockAndLoad_CORE_AT_061:
		case CardIds.LockAndLoad_WON_023:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.LockOn_SC_407:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.PatchesThePirate_LockedAndLoaded_THD_025p:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.LohTheLivingLegend_TLC_257:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.LokenJailerOfYoggSaron:
			return and(side(inputSide), inDeck, minion);
		case CardIds.LongneckEgg_DINO_130:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.LorewalkerChoLegacy:
		case CardIds.LorewalkerChoVanilla:
		case CardIds.LorewalkerCho_CORE_EX1_100:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.LorthemarTheron_RLK_593:
			return and(side(inputSide), inDeck, minion);
		case CardIds.LoveEverlasting:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.LuckyComet_GDB_873:
			return and(side(inputSide), or(inHand, inDeck), minion, combo);
		case CardIds.Lurker_SC_009:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, zerg),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.LushwaterScout:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.MadScientist:
			return and(side(inputSide), inDeck, secret);
		case CardIds.MagathaBaneOfMusic:
			return and(side(inputSide), inDeck, spell);
		case CardIds.MagisterDawngrasp_AV_200:
			return and(side(inputSide), inOther, spell, hasSpellSchool, spellPlayedThisMatch);
		case CardIds.MagisterUnchainedTavernBrawlToken:
			return and(side(inputSide), inDeck, spell);
		case CardIds.MagistersApprentice:
			return and(side(inputSide), inDeck, spell, arcane);
		case CardIds.Malfunction_MIS_107:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MalganisCore:
		case CardIds.Malganis_GVG_021:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.Malorne:
		case CardIds.Malorne_WON_011:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.MalorneTheWaywatcher_EDR_888:
			return and(side(inputSide), or(inDeck, inHand), imbue);
		case CardIds.MalygosAspectOfMagic:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.MalygosTheSpellweaverCore:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ManaCyclone:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ManaGiant:
			return and(side(inputSide), or(inDeck, inHand, inOther), notInInitialDeck);
		case CardIds.ManAtArms:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.MantleShaper_DEEP_004:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ManufacturingError_TOY_371:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MarkOfScorn:
			return and(side(inputSide), inDeck, not(minion));
		case CardIds.MarkOfTheSpikeshell:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), taunt, minion),
				and(side(inputSide), or(inHand, inDeck), minion),
			);
		case CardIds.MaroonedArchmage_VAC_435:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.MarshlandThresher_TLC_256:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Marshspawn_BT_115:
		case CardIds.Marshspawn_CORE_BT_115:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.MaskedReveler:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MassResurrection_DAL_724:
			return tooltip(and(side(inputSide), inGraveyard, minion));
		case CardIds.MastersCall:
		case CardIds.MastersCall_CORE_TRL_339:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, beast),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.MasterJouster:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MaximaBlastenheimer:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MeatGrinder_RLK_120:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Merithra_EDR_238:
			return and(side(inputSide), or(inDeck, inHand), minion, costMore(7));
		case CardIds.MechanizedMagma_TLC_224:
			return and(side(inputSide), or(inDeck, inHand), fire, spell);
		case CardIds.MechaShark_TSC_054:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.MeddlesomeServant_YOG_518:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.MeekMasteryTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, neutral);
		case CardIds.Melomania:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.MeltedMaker:
			return and(side(inputSide), or(inDeck, inHand), forge);
		case CardIds.MenagerieJug_WON_142:
		case CardIds.MenagerieJug_CORE_WON_142:
		case CardIds.MenagerieMug_WON_141:
		case CardIds.MenagerieMug_CORE_WON_141:
			return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
		case CardIds.MenagerieWarden_CORE_KAR_065:
		case CardIds.MenagerieWarden_KAR_065:
		case CardIds.MenagerieWarden_WON_305:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.MendingPoolsTavernBrawl:
			return and(side(inputSide), spell, nature);
		case CardIds.MesaduneTheFractured_WW_429:
			return and(side(inputSide), inDeck, elemental);
		case CardIds.MessengerBuzzard_WW_807:
			return and(side(inputSide), inDeck, beast);
		case CardIds.MimironTheMastermind:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.MinecartCruiser_WW_326:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.MistahVistah_VAC_519:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.Mixtape:
			return tooltip(and(opposingSide(inputSide), cardsPlayedThisMatch));
		case CardIds.MoatLurker:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.MonstrousMosquito_EDR_816:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.MoshPit:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Muckmorpher:
			return and(side(inputSide), inDeck, minion, not(cardIs(CardIds.Muckmorpher)));
		case CardIds.MulchMadnessTavernBrawl:
			return and(side(inputSide), minion, neutral);
		case CardIds.MummyMagic:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.Murmur_GDB_448:
			return and(side(inputSide), or(inDeck, inHand), minion, battlecry);
		case CardIds.MurmuringElemental:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.MurkwaterScribe:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.MuscleOTron_YOG_525:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.MutatingInjection_NAX11_04:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Myrmidon:
			return and(side(inputSide), or(inDeck, inHand), spell, canTargetFriendlyMinion);
		case CardIds.MysteriousChallenger:
		case CardIds.MysteriousChallenger_WON_334:
			return and(side(inputSide), inDeck, secret);
		case CardIds.MysteryEgg_TOY_351:
		case CardIds.MysteryEgg_MysteryEggToken_TOY_351t:
			return and(side(inputSide), inDeck, beast);
		case CardIds.NagaGiant:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.NagasPride:
			return and(side(inputSide), or(inDeck, inHand), naga);
		case CardIds.NaralexHeraldOfTheFlights_EDR_844:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.NaturalForceTavernBrawl:
			return and(side(inputSide), spell, nature, dealsDamage);
		case CardIds.NerubianVizier:
			return and(side(inputSide), or(inDeck, inHand), minion, undead);
		case CardIds.NecriumApothecary:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.NecriumBlade:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.NecriumVial:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.NecroticMortician:
		case CardIds.NecroticMortician_CORE_RLK_116:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NetherBreath_DRG_205:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.NightmareLordXavius_EDR_856:
			return and(side(inputSide), inDeck, minion);
		case CardIds.NineLives:
			return and(side(inputSide), or(inHand, inDeck, inGraveyard), minion, deathrattle);
		case CardIds.NiriOfTheCrater_TLC_836:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, effectiveCostEqual(1)),
				and(side(inputSide), or(inHand, inDeck), spell, effectiveCostEqual(1)),
			);
		case CardIds.NorthernNavigation:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, frost),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
		case CardIds.NostalgicInitiate_TOY_340:
		case CardIds.NostalgicInitiate_NostalgicInitiateToken_TOY_340t1:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.NoxiousInfiltrator:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NydusWorm_SC_015:
			return and(side(inputSide), inDeck, zerg);
		case CardIds.NzothGodOfTheDeep:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, not(tribeless)),
				and(side(inputSide), inGraveyard, minion, not(tribeless)),
			);
		case CardIds.NzothTheCorruptor:
			return and(side(inputSide), or(inGraveyard, inHand, inDeck), minion, deathrattle);
		case CardIds.OakenSummons:
		case CardIds.OakenSummons_CORE_LOOT_309:
			return and(side(inputSide), inDeck, minion, effectiveCostLess(5));
		case CardIds.OasisOutlaws_WW_404:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.Obsidiansmith:
			return highlightConditions(and(side(inputSide), inDeck, minion), and(side(inputSide), inDeck, weapon));
		case CardIds.OldMilitiaHornTavernBrawl:
		case CardIds.OldMilitiaHorn_MilitiaHornTavernBrawl:
		case CardIds.OldMilitiaHorn_VeteransMilitiaHornTavernBrawl:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.TheOneAmalgamBand:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, hasTribeNotPlayedThisMatch, not(tribeless)),
				and(side(inputSide), or(inHand, inDeck), minion, not(tribeless)),
			);
		case CardIds.OnyxBishop:
		case CardIds.OnyxBishop_WON_057:
			return tooltip(and(side(inputSide), inGraveyard));
		case CardIds.OnyxianWarder:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.Oondasta:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.OopsAllSpellsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.OpenTheDoorwaysTavernBrawl:
			return and(side(inputSide), discover);
		case CardIds.OptimizedPolarityTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), mech, not(magnetic));
		case CardIds.OracleOfElune:
			return and(side(inputSide), minion, effectiveCostLess(3));
		case CardIds.OrbOfRevelationTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), or(discover, and(spell, effectiveCostMore(2))));
		case CardIds.OutfitTailor:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.OrbitalHalo_GDB_439:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.OrbitalMoon_GDB_475:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.OverflowSurger_WW_424:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.OvergrownBeanstalk_MIS_301:
			return and(side(inputSide), or(inDeck, inHand), summonsTreant);
		case CardIds.OvergrownHorror_EDR_654:
			return and(side(inputSide), or(inDeck, inHand), darkGift);
		case CardIds.Overheat_FIR_906:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), nature, spell),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.OverlordSaurfang_BAR_334:
			return highlightConditions(
				and(side(inputSide), minion, or(inHand, inDeck), frenzy),
				and(side(inputSide), minion, inGraveyard, frenzy),
			);
		case CardIds.OverlordsWhip:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.OverseerFrigidaraCore_RLK_224:
		case CardIds.OverseerFrigidara_LEG_RLK_224:
		case CardIds.OverseerFrigidaraCore_RLK_Prologue_RLK_224:
			return highlightConditions(and(side(inputSide), inDeck, spell, frost), and(side(inputSide), inDeck, spell));
		case CardIds.Owlonius_TOY_807:
			return and(side(inputSide), or(inHand, inDeck), or(and(spell, dealsDamage), spellDamage));
		case CardIds.PaintedCanvasaur_TOY_350:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.PaintersVirtue_TOY_810:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Paleomancy_TLC_434:
			return and(side(inputSide), or(inHand, inDeck), generateCorpse);
		case CardIds.PalmReading:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.PantherMask_DINO_432:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ParachuteBrigand:
		case CardIds.PatchesThePirate_CFM_637:
			return and(side(inputSide), or(inDeck, inHand), minion, pirate);
		case CardIds.ParallaxCannon_GDB_843:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.ParchedDesperado_WW_407:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ParrotSanctuary_VAC_409:
			return and(side(inputSide), or(inDeck, inHand), minion, battlecry);
		case CardIds.PartyAnimal:
			return and(side(inputSide), or(inHand, inDeck), minion, not(tribeless));
		case CardIds.PartyPortalTavernBrawl_PVPDR_SCH_Active08:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.PeacefulPiper:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.PendantOfEarth_DEEP_026:
			return and(side(inputSide), inDeck, minion);
		case CardIds.PebblyPage_WON_090:
			return and(side(inputSide), inDeck, overload);
		case CardIds.PetalPeddler_EDR_889:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.PetalPicker_FIR_921:
			return and(side(inputSide), or(inHand, inDeck), imbue);
		case CardIds.PetCollector:
			return and(side(inputSide), inDeck, minion, beast, effectiveCostLess(6));
		case CardIds.PetParrot_VAC_961:
			return (input: SelectorInput): SelectorOutput => {
				const oneCostCardsPlayed = input.deckState.cardsPlayedThisMatch.filter(
					(c) => allCards.getCard(c.cardId).cost === 1,
				);
				const target = pickLast(oneCostCardsPlayed);
				return highlightConditions(
					and(side(inputSide), entityIs({ entityId: target?.entityId, cardId: target?.cardId })),
					and(side(inputSide), or(inHand, inDeck), baseCostEqual(1)),
				)(input);
			};
		case CardIds.PhotonCannon_SC_753:
			return and(side(inputSide), or(inDeck, inHand), minion, protoss);
		case CardIds.PileOfBones_WW_324:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.PileOnHeroic:
			return and(side(inputSide), inDeck, minion);
		case CardIds.PillageTheFallenTavernBrawl:
			return and(side(inputSide), weapon);
		case CardIds.PipsiPainthoof_TOY_812:
			return highlightConditions(
				and(side(inputSide), inDeck, divineShield),
				and(side(inputSide), inDeck, rush),
				and(side(inputSide), inDeck, taunt),
			);
		case CardIds.PipThePotent_WW_394:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(1));
		case CardIds.PitCommander:
			return and(side(inputSide), inDeck, minion, demon);
		case CardIds.PitStop:
			return and(side(inputSide), inDeck, minion, mech);
		case CardIds.PlaguebringerTavernBrawl:
			return and(side(inputSide), spell, effectiveCostMore(1));
		case CardIds.PlanetaryNavigator_GDB_444:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.PlayDead_ICC_052:
		case CardIds.PlayDead_CORE_ICC_052:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.PluckyPaintfin_TOY_517:
			return and(side(inputSide), inDeck, rush);
		case CardIds.Plunder:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.PoisonBreath_CORE_EDR_002:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.PopgarThePutrid_WW_091:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.PortalmancerSkyla_WORK_063:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.PossessedAnimancer_DINO_131:
			return and(side(inputSide), inDeck, beast);
		case CardIds.PotionOfSparkingTavernBrawl:
			return and(side(inputSide), minion, rush);
		case CardIds.PowerSlider:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, hasTribeNotPlayedThisMatch, not(tribeless)),
				and(side(inputSide), or(inHand, inDeck), minion, not(tribeless)),
			);
		case CardIds.PowerWordFortitude:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.PowerChordSynchronize:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.PredatoryInstincts:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.Predation:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.PreparationCore:
		case CardIds.PreparationLegacy:
		case CardIds.PreparationVanilla:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Prescience:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, costMore(4)),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.PressurePoints_GDB_881:
			return and(side(inputSide), or(inHand, inDeck), combo);
		case CardIds.PriestessValishj:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.PrimalDungeoneer:
			return highlightConditions(
				and(side(inputSide), inDeck, nature, spell),
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), inDeck, elemental),
			);
		case CardIds.PrimalfinChallenger_TLC_251:
			return and(side(inputSide), or(inHand, inDeck), kindred);
		case CardIds.PrimordialProtector_BAR_042:
			return and(side(inputSide), inDeck, spell);
		case CardIds.PrinceLiam:
			return and(side(inputSide), inDeck, effectiveCostEqual(1));
		case CardIds.PrincessTavernBrawl:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.PrisonBreaker_YOG_411:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.PrivateEye:
			return and(side(inputSide), inDeck, secret);
		case CardIds.Product9_MIS_914:
			return highlightConditions(
				tooltip(and(side(inputSide), secretsTriggeredThisMatch)),
				and(side(inputSide), or(inDeck, inHand, inOther), secret),
			);
		case CardIds.ProstheticHand_DEEP_015:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, mech),
				and(side(inputSide), or(inDeck, inHand), minion, undead),
			);
		case CardIds.ProvingGrounds:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Pufferfist:
			return and(side(inputSide), or(inHand, inDeck), givesHeroAttack);
		case CardIds.PuppetmasterDorian_MIS_026:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Psychopomp:
			return and(side(inputSide), inGraveyard, minion);
		case CardIds.Pyrotechnician:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.QualityAssurance_TOY_605:
			return and(side(inputSide), inDeck, minion, taunt);
		case CardIds.QueenAzshara_TSC_641:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Queensguard:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.RaiseDead_SCH_514:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), inGraveyard, minion),
			);
		case CardIds.ImpendingCatastrophe:
			return and(side(inputSide), or(inDeck, inHand), minion, imp);
		case CardIds.ImpKingRafaam_REV_789:
		case CardIds.ImpKingRafaam_REV_835:
		case CardIds.ImpKingRafaam_ImpKingRafaamToken:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, imp),
				and(side(inputSide), inGraveyard, minion, imp),
			);
		case CardIds.RadarDetector_TSC_079:
			return and(side(inputSide), inDeck, mech);
		case CardIds.RaDen:
			return tooltip(and(side(inputSide), minionPlayedThisMatch, notInInitialDeck, not(cardIs(CardIds.RaDen))));
		case CardIds.RadianceOfAzshara_TSC_635:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, fire),
				and(side(inputSide), or(inHand, inDeck), spell, nature),
				and(side(inputSide), or(inHand, inDeck), spell, frost),
			);
		case CardIds.RagingFelscreamerCore:
		case CardIds.RagingFelscreamer_BT_416:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.RaidBossOnyxia_ONY_004:
			return and(side(inputSide), or(inDeck, inHand, inPlay, inGraveyard), minion, whelp);
		case CardIds.RaidingParty:
		case CardIds.RaidingParty_CORE_TRL_124:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), pirate),
				and(side(inputSide), or(inDeck, inHand), weapon),
			);
		case CardIds.RaidTheDocks:
			return highlightConditions(and(side(inputSide), inDeck, pirate), and(side(inputSide), inDeck, weapon));
		case CardIds.RaidTheSkyTemple:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.RajNazjan:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.Rally:
			return and(side(inputSide), inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
		case CardIds.RallyTheTroopsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.RambunctiousStuffy_TOY_821:
			return and(side(inputSide), or(inDeck, inHand), spell, frost);
		case CardIds.RamkahenWildtamer:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.RangariScout_GDB_841:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.RatchetPrivateer:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.ForestWardenOmu_RapidGrowth_THD_007p:
			return and(side(inputSide), or(inDeck, inHand), summonsTreant);
		case CardIds.Ravage_SC_004hp:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.RavenousFelhunter_EDR_891:
			return and(side(inputSide), or(inHand, inDeck, inGraveyard), minion, deathrattle, baseCostLessThan(5));
		case CardIds.RayllaSandSculptor_VAC_424:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Razorboar:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle, effectiveCostLess(4));
		case CardIds.RazorfenBeastmaster:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle, effectiveCostLess(5));
		case CardIds.RazormaneBattleguard:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.ReachEquilibrium_TLC_817:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), holy, spell),
				and(side(inputSide), or(inHand, inDeck), shadow, spell),
			);
		case CardIds.ReachEquilibrium_CleanseTheShadowToken_TLC_817t:
			return and(side(inputSide), or(inHand, inDeck), holy, spell);
		case CardIds.ReachEquilibrium_CorruptTheLightToken_TLC_817t2:
			return and(side(inputSide), or(inHand, inDeck), shadow, spell);
		case CardIds.ReanimateTheTerror_TLC_433:
			return and(side(inputSide), or(inHand, inDeck), spendCorpse);
		case CardIds.ReanimatedPterrordax_TLC_436:
			return and(side(inputSide), or(inHand, inDeck), generateCorpse);
		case CardIds.RecordScratcher:
			return and(side(inputSide), or(inHand, inDeck), combo);
		case CardIds.RedscaleDragontamer:
		case CardIds.RedscaleDragontamer_CORE_DMF_194:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.Reforestation_AidOfTheForest_EDR_843a:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Reforestation_Fertilize_EDR_843b:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Reforestation_EDR_843:
		case CardIds.Reforestation_ReforestationToken_EDR_843t1:
			return highlightConditions(and(side(inputSide), inDeck, spell), and(side(inputSide), inDeck, minion));
		case CardIds.RefreshingSpringWater:
			return and(side(inputSide), inDeck, spell);
		case CardIds.RelicVault_CORE_REV_942:
		case CardIds.RelicVault_REV_797:
		case CardIds.RelicVault_REV_942:
			return and(side(inputSide), or(inDeck, inHand), relic);
		case CardIds.ReliquaryResearcher_WW_432:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		// case CardIds.DeepminerBrann_DEEP_020:
		// case CardIds.RenoLoneRanger_WW_0700:
		// case CardIds.TheldurinTheLost_WW_815:
		case CardIds.DinotamerBrann_ULD_156:
		case CardIds.EliseTheEnlightened:
		case CardIds.EliseTheTrailblazer:
		case CardIds.Kazakus_CFM_621:
		case CardIds.MurozondThiefOfTime_WON_066:
		case CardIds.RenoJackson_CORE_LOE_011:
		case CardIds.RenoJackson_LOE_011:
		case CardIds.RenoTheRelicologist:
		case CardIds.ZephrysTheGreat_ULD_003:
			return and(side(inputSide), inDeck, hasMultipleCopies);
		case CardIds.SporeEmpressMoldara_ReplicatingSporeToken_GDB_234t:
			return (input: SelectorInput): SelectorOutput => {
				const summoned = input.deckState
					.getAllCardsInDeckWithoutOptions()
					.filter((c) => c.creatorCardId === CardIds.SporeEmpressMoldara_ReplicatingSporeToken_GDB_234t)
					// Won't work if two spores summon the same minion
					.map((c) => c.cardId as CardIds);
				return tooltip(and(side(inputSide), cardIs(...summoned)))(input);
			};
		case CardIds.ResplendentDreamweaver_EDR_860:
			return and(side(inputSide), or(inHand, inDeck), imbue);
		case CardIds.RestInPeace_VAC_457:
			return (input: SelectorInput): SelectorOutput => {
				const highestDeadMinionCost = Math.max(
					...input.deckState.minionsDeadThisMatch.map(
						(c) => c.effectiveCost ?? allCards.getCard(c.cardId).cost,
					),
				);
				const targets = input.deckState.minionsDeadThisMatch
					.filter((c) => (c.effectiveCost ?? allCards.getCard(c.cardId).cost) === highestDeadMinionCost)
					.map((c) => ({ entityId: c.entityId, cardId: c.cardId }));
				return and(side(inputSide), entityIs(...targets))(input);
			};
		case CardIds.Resuscitate_TLC_818:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, effectiveCostMore(0), effectiveCostLess(4)),
				and(side(inputSide), inGraveyard, minion, effectiveCostMore(0), effectiveCostLess(4)),
			);
		case CardIds.Resurrect_BRM_017:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), inGraveyard, minion),
			);
		case CardIds.ReturnPolicy_MIS_102:
			return and(side(inputSide), or(inHand, inDeck, inGraveyard), deathrattle);
		case CardIds.RevivePet:
			return tooltip(and(side(inputSide), inGraveyard, minion, beast));
		case CardIds.Rewind_ETC_532:
			return and(side(inputSide), or(inHand, inDeck), spell, not(cardIs(CardIds.Rewind_ETC_532)));
		case CardIds.RhoninsScryingOrbTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.RhymeSpinner:
			return and(side(inputSide), or(inDeck, inHand), combo);
		case CardIds.RighteousReservesTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
		case CardIds.RimefangSwordCore:
		case CardIds.RimefangSword_LEG_RLK_710:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.RimescaleSiren:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Rimetongue:
			return and(side(inputSide), or(inDeck, inHand), frost, spell);
		case CardIds.RingmasterWhatley:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, dragon),
				and(side(inputSide), inDeck, minion, mech),
				and(side(inputSide), inDeck, minion, pirate),
			);
		case CardIds.RingOfBlackIceTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), freeze);
		case CardIds.RingOfPhaseshiftingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, legendary);
		case CardIds.RingOfRefreshmentTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.RiskySkipper:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.RitualOfTheNewMoon_EDR_461:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.RivendareWarrider:
			return and(
				side(inputSide),
				inGraveyard,
				cardIs(
					CardIds.RivendareWarrider,
					CardIds.RivendareWarrider_BlaumeuxFamineriderToken,
					CardIds.RivendareWarrider_KorthazzDeathriderToken,
					CardIds.RivendareWarrider_ZeliekConquestriderToken,
				),
			);
		case CardIds.Roach_SC_012:
			return and(side(inputSide), or(inDeck, inHand), minion, zerg);
		case CardIds.RoaringApplause:
			return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
		case CardIds.RobeOfTheApprenticeTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		case CardIds.RobeOfTheMagi:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		case CardIds.RobesOfShrinkingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.RocketBackpacksTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, not(rush));
		case CardIds.RollingStone:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(1));
		case CardIds.RoostingGargoyle:
		case CardIds.RoostingGargoyle_CORE_REV_351:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.RollTheBones_ICC_201:
		case CardIds.RollTheBones_CORE_ICC_201:
			return and(side(inputSide), inDeck, deathrattle);
		case CardIds.RotheartDryad_EDR_485:
			return and(side(inputSide), inDeck, minion, costMore(6));
		case CardIds.RottenRodent:
			return and(side(inputSide), inDeck, deathrattle);
		case CardIds.RottingNecromancer:
			return and(side(inputSide), inDeck, minion, undead);
		case CardIds.RowdyPartner_WW_906:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(4));
		case CardIds.RoyalGreatswordTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, legendary);
		case CardIds.RuneDagger:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.RuneforgingCore:
		case CardIds.Runeforging_LEG_RLK_715:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.RunningWild:
		case CardIds.RunningWild_RunningWild:
			return and(side(inputSide), inDeck, minion);
		case CardIds.RushTheStage:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.SailboatCaptain_VAC_937:
			return and(side(inputSide), or(inHand, inDeck), minion, pirate);
		case CardIds.SalhetsPride:
			return and(side(inputSide), inDeck, minion, healthLessThan(2));
		case CardIds.Sandbinder:
			return and(side(inputSide), inDeck, minion, elemental);
		case CardIds.SaroniteShambler_YOG_521:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Saruun_GDB_304:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), elemental),
				and(side(inputSide), or(inHand, inDeck), spell, fire, damage),
			);
		case CardIds.Sasquawk_VAC_415:
			return tooltip(and(side(inputSide), cardsPlayedLastTurn));
		case CardIds.ScaleReplica_TOY_387:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.Scalerider:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.Scaleworm:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.ScuttlebuttGhoul:
		case CardIds.ScuttlebuttGhoul_CORE_REV_900:
			return and(side(inputSide), or(inHand, inDeck), secret);
		case CardIds.Scv_SC_401:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.SeaShill_VAC_332:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.SeasideGiant_VAC_439:
			return and(side(inputSide), or(inHand, inDeck), locationExtended);
		case CardIds.SeaweedStrike:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.Seismopod_DINO_421:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SigilOfReckoning:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.SirFinleyMrrgglton_ScalesOfJustice_THD_044p:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.ScavengersIngenuity:
			return and(side(inputSide), inDeck, beast);
		case CardIds.ScepterOfSummoning:
			return and(side(inputSide), or(inDeck, inHand), minion, effectiveCostMore(5));
		case CardIds.ScourgeIllusionist:
			return and(side(inputSide), inDeck, minion, deathrattle, not(cardIs(CardIds.ScourgeIllusionist)));
		case CardIds.ScorchingWinds_FIR_910:
			return and(side(inputSide), or(inHand, inDeck), spell, fire);
		case CardIds.Scorchreaver_FIR_952:
			return and(side(inputSide), or(inHand, inDeck), spell, fel);
		case CardIds.ScrapbookingStudent_VAC_529:
			return and(side(inputSide), or(inHand, inDeck), locationExtended);
		case CardIds.ScrapShot:
			return and(side(inputSide), inDeck, beast);
		case CardIds.ScrollSavvy:
			return and(side(inputSide), inDeck, spell);
		case CardIds.SeafloorGateway_TSC_055:
			return and(side(inputSide), inDeck, minion, mech);
		case CardIds.SeafloorSavior_TSC_083:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SeascoutOperator_TSC_646:
			return and(side(inputSide), or(inHand, inDeck), minion, mech);
		case CardIds.SecurityAutomaton_TSC_928:
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		case CardIds.SenseDemonsLegacy_EX1_317:
		case CardIds.SenseDemonsVanilla_VAN_EX1_317:
			return and(side(inputSide), inDeck, minion, demon);
		case CardIds.Sentry_SC_764:
			return and(side(inputSide), or(inDeck, inHand), minion, protoss);
		case CardIds.SesselieOfTheFaeCourt_REV_319:
		case CardIds.SesselieOfTheFaeCourt_REV_782:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SecretStudiesTavernBrawl:
			return and(side(inputSide), inDeck, secret);
		case CardIds.SelectiveBreederCore:
			return and(side(inputSide), inDeck, beast);
		case CardIds.SelflessSidekick:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.Serpentbloom:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.SerpentWig_TSC_215:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.ServiceBell:
			return and(side(inputSide), inDeck, not(neutral));
		case CardIds.Shadehound:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.ShadestoneSkulker_DEEP_012:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.Shadowborn:
			return and(side(inputSide), or(inDeck, inHand), spell, shadow);
		case CardIds.Shadowcaster:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Shadowcasting101TavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ShadowclothNeedle:
			return and(side(inputSide), or(inDeck, inHand), shadow, spell);
		case CardIds.ShadowEssence_CORE_ICC_235:
		case CardIds.ShadowEssence_ICC_235:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ShadowOfDemise:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ShadowtouchedKvaldir_YOG_300:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		case CardIds.ShadowVisions:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ShadowWordUndeath:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.ShadyDealer:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.Shaladrassil_EDR_846:
			return and(side(inputSide), or(inHand, inDeck), costMore(card?.getEffectiveManaCost()));
		case CardIds.ShaleSpider_DEEP_034:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.ShallowGrave:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.ShandoWildclaw:
		case CardIds.ShandoWildclaw_RileTheHerd:
		case CardIds.ShandoWildclaw_Transfiguration:
			return and(side(inputSide), inDeck, beast);
		case CardIds.SharkPuncher_WON_138:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.SharpEyedSeeker:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.SharpShipment_WORK_005:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.Shattershambler:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.SheldrasMoontree:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ShimmeringSunfish:
			return and(side(inputSide), or(inDeck, inHand), holy, spell);
		case CardIds.ShipsCannon:
			return and(side(inputSide), or(inDeck, inHand), minion, pirate);
		case CardIds.Si7Assassin:
		case CardIds.Si7Informant:
		case CardIds.Si7Smuggler:
		case CardIds.FindTheImposter:
		case CardIds.FindTheImposter_LearnTheTruthToken:
		case CardIds.FindTheImposter_MarkedATraitorToken:
		case CardIds.JalTheSharpshot:
			return and(side(inputSide), or(inDeck, inHand), minion, isSi7);
		case CardIds.ShadowstepCore:
		case CardIds.ShadowstepLegacy:
		case CardIds.ShadowstepVanilla:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ShatariCloakfield_GDB_103:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ShieldBattery_SC_759:
			return and(side(inputSide), or(inHand, inDeck), protoss, spell);
		case CardIds.ShieldSlamCore:
		case CardIds.ShieldSlamLegacy:
		case CardIds.ShieldSlamVanilla:
			return and(side(inputSide), or(inHand, inDeck), givesArmor);
		case CardIds.ShirvallahTheTiger:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ShiveringSorceress:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Shockspitter:
			return and(side(inputSide), or(inDeck, inHand), givesHeroAttack);
		case CardIds.ShoplifterGoldbeard_TOY_511:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.ShroudOfConcealment:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Shudderblock_TOY_501:
		case CardIds.Shudderblock_ShudderblockToken_TOY_501t:
			return and(side(inputSide), or(inHand, inDeck), battlecry);
		case CardIds.Shudderwock_GIL_820:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), battlecry),
				tooltip(and(side(inputSide), cardsPlayedThisMatch, battlecry)),
			);
		case CardIds.SicklyGrimewalker_YOG_512:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.SiegeTank_SC_413:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.SilvermoonBrochure_WORK_017:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SilvermoonFarstrider_RLK_826:
			return and(side(inputSide), or(inDeck, inHand), spell, arcane);
		case CardIds.SilvermoonPortal:
		case CardIds.SilvermoonPortal_WON_309:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SilverVanguard:
			return and(side(inputSide), inDeck, minion, effectiveCostEqual(8));
		case CardIds.SinisterSoulcage_YOG_513:
			return and(side(inputSide), or(inDeck, inHand), undead, minion);
		case CardIds.SkarrTheCatastrophe_WW_026:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.SkeletalSidekickCore_RLK_958:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.SketchyInformation:
			return and(side(inputSide), inDeck, deathrattle, effectiveCostLess(5));
		case CardIds.SketchArtist_TOY_916:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.Skyfin:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.SkulkingGeist_CORE_ICC_701:
		case CardIds.SkulkingGeist_ICC_701:
			return and(side(inputSide), or(inDeck, inHand), spell, baseCostEqual(1));
		case CardIds.Slagclaw_TLC_482:
			return and(side(inputSide), or(inDeck, inHand), generateSlagclaw);
		case CardIds.SlagmawTheSlumbering_WW_375:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.SlipperySlope_VAC_513:
			return and(side(inputSide), or(inDeck, inHand), freeze);
		case CardIds.SlitheringDeathscale:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.SmallTimeBuccaneer:
		case CardIds.SmallTimeBuccaneer_WON_351:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		case CardIds.Smokescreen:
			return and(side(inputSide), inDeck, deathrattle);
		case CardIds.SmolderingStrength_FIR_914:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Snapdragon:
			return and(side(inputSide), inDeck, minion, battlecry);
		case CardIds.SnatchAndGrab_VAC_700:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.SockPuppetSlitherspear_MIS_710:
			return and(side(inputSide), or(inHand, inDeck), givesHeroAttack);
		case CardIds.SonyaWaterdancer_TOY_515:
			return and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(1), minion);
		case CardIds.SootSpewer:
		case CardIds.SootSpewer_WON_033:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.Soridormi_WON_146:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.SorcerersGambit:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), spell, fire),
				and(side(inputSide), or(inDeck, inHand), spell, frost),
				and(side(inputSide), or(inDeck, inHand), spell, arcane),
			);
		case CardIds.SorcerousSubstitute:
			return and(side(inputSide), or(inDeck, inHand), spellDamage);
		case CardIds.SoulburnerVaria_YOG_520:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.SouleatersScythe_BoundSoulToken:
			return tooltip(and(inOther, minion, lastAffectedByCardId(CardIds.SouleatersScythe)));
		case CardIds.SoulrestCeremony_DINO_417:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SouthseaDeckhand_CORE_CS2_146:
		case CardIds.SouthseaDeckhandLegacy:
		case CardIds.SouthseaDeckhandVanilla:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.SowTheSeedsTavernBrawl:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SpacePirate_GDB_333:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.SpecialDeliveryTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, rush);
		case CardIds.SpectralTrainee:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Spellcoiler:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Spelunker_TLC_450:
			return and(side(inputSide), or(inDeck, inHand), generatesTemporaryCard);
		case CardIds.LesserSpinelSpellstone_TOY_825:
		case CardIds.LesserSpinelSpellstone_SpinelSpellstoneToken_TOY_825t:
		case CardIds.LesserSpinelSpellstone_GreaterSpinelSpellstoneToken_TOY_825t2:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.SpacerockCollector_GDB_875:
			return and(side(inputSide), or(inHand, inDeck), combo);
		case CardIds.SpawningPool_SC_000:
			return and(side(inputSide), or(inDeck, inHand), minion, zerg);
		case CardIds.SpineCrawler_SC_023:
			return and(side(inputSide), or(inHand, inDeck), locationExtended);
		case CardIds.SpinetailDrake_WW_820:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.SpiritOfTheBadlands_WW_337:
		case CardIds.SpiritOfTheBadlands_MirageToken_WW_337t:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.SpiritOfTheMountain_TLC_229:
			return and(side(inputSide), or(inHand, inDeck), minion, not(tribeless));
		case CardIds.SpiritPeddler_WORK_015:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.SpiritGuide:
		case CardIds.SpiritGuide_CORE_AV_328:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, shadow),
				and(side(inputSide), inDeck, spell, holy),
			);
		case CardIds.SplishSplashWhelp_WW_819:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.SpitefulSummoner:
			return and(side(inputSide), inDeck, spell);
		case CardIds.SpitelashSiren:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell),
				and(side(inputSide), or(inHand, inDeck), naga),
			);
		case CardIds.SplittingAxe:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.SpontaneousCombustion_GDB_456:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.SolarFlare_GDB_305:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.SpotTheDifference_TOY_374:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SpreadingSaplingsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.RuleModifier_SpreadOfCorruptionToken_TTN_002t45:
			return and(spell);
		case CardIds.SpringTheTrap:
			return and(side(inputSide), inDeck, secret);
		case CardIds.SrExcavatorTavernBrawl:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SrTombDiver_ULDA_021:
		case CardIds.JrTombDiver:
		case CardIds.JrTombDiverTavernBrawl:
		case CardIds.SrTombDiverTavernBrawl:
			return and(
				side(inputSide),
				or(and(or(inDeck, inHand), spell, secret), and(inOther, cardsPlayedThisMatch, spell, secret)),
			);
		case CardIds.StaffOfPainTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, shadow);
		case CardIds.StaffOfRenewal:
		case CardIds.StaffOfRenewalTavernBrawl:
			return (input: SelectorInput): boolean => {
				const deadMinions = [...input.deckState.otherZone]
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.filter((c) => c.zone === 'GRAVEYARD');
				if (!deadMinions.length) {
					return false;
				}
				const numberToResurrect = cardId === CardIds.StaffOfRenewal ? 7 : 5;
				const mostExpensiveMinions = deadMinions
					.sort((a, b) => a.getEffectiveManaCost() - b.getEffectiveManaCost())
					.reverse()
					.slice(0, numberToResurrect);
				const lastMinion = mostExpensiveMinions[mostExpensiveMinions.length - 1];
				return (
					side(inputSide)(input) &&
					minion(input) &&
					inGraveyard(input) &&
					input.deckCard?.getEffectiveManaCost() >= lastMinion?.getEffectiveManaCost()
				);
			};
		case CardIds.StageDive:
		case CardIds.StageDive_StageDive:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.StakingAClaimTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.Stargazing_WW_425:
			return and(side(inputSide), inDeck, spell, arcane, not(cardIs(CardIds.Stargazing_WW_425)));
		case CardIds.StarlightGroove:
			return and(side(inputSide), or(inDeck, inHand), holy, spell);
		case CardIds.StarlightReactor_GDB_108:
			return and(side(inputSide), or(inDeck, inHand), spell, arcane);
		case CardIds.StarlightWanderer_GDB_720:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.StarlightWhelp:
			return highlightConditions(
				tooltip(and(side(inputSide), inStartingHand)),
				and(side(inputSide), inStartingHand),
			);
		case CardIds.Starscryer:
			return and(side(inputSide), inDeck, spell);
		case CardIds.StarvingTavernBrawl:
			return and(side(inputSide), minion, beast);
		case CardIds.Steamcleaner:
		case CardIds.Steamcleaner_CORE_REV_946:
			return and(notInInitialDeck, inDeck);
		case CardIds.SteamGuardian:
			return highlightConditions(and(side(inputSide), inDeck, spell, fire), and(side(inputSide), inDeck, spell));
		case CardIds.SteamSurger:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.StewardOfDarkshire_OG_310:
		case CardIds.StewardOfDarkshire_WON_310:
			return and(side(inputSide), or(inHand, inDeck), minion, healthLessThan(2));
		case CardIds.StickyFingersTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
		case CardIds.JimRaynor_Stimpack_SC_400p:
			return and(side(inputSide), or(inHand, inDeck), terran, minion);
		case CardIds.StitchedGiantCore_RLK_744:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.StolenGoods:
		case CardIds.StolenGoods_WON_110:
			return and(side(inputSide), inDeck, taunt);
		case CardIds.StonehearthVindicator:
			return and(side(inputSide), inDeck, spell, effectiveCostLess(4));
		case CardIds.StoneSentinel:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.StorageScuffle_TLC_365:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.Stormhammer:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.StormpikeBattleRam:
			return and(side(inputSide), or(inDeck, inHand), minion, beast);
		case CardIds.StoryOfBarnabus_TLC_231:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, attackGreaterThan(4)),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.StoryOfTheWaygate_TLC_364:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
		case CardIds.StrandedSpaceman_GDB_861:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.StranglethornHeart:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), beast, effectiveCostMore(4)),
				and(side(inputSide), inGraveyard, beast, effectiveCostMore(4)),
			);
		case CardIds.StrengthInNumbers:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.SuccumbToMadness_EDR_455:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.Suffocate_GDB_476:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.SummerFlowerchild:
			return and(side(inputSide), inDeck, effectiveCostMore(5));
		case CardIds.SummonerDarkmarrow_VAC_503:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.SunfuryChampion:
			return and(side(inputSide), or(inDeck, inHand), spell, fire);
		case CardIds.SunsapperLynessa_VAC_507:
			return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostLess(3));
		case CardIds.SunstridersCrownTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.SunwingSquawker:
			return (input: SelectorInput): SelectorOutput => {
				const lastSpell = pickLast(input.deckState.spellsPlayedOnFriendlyMinions);
				return highlightConditions(
					tooltip(
						and(side(inputSide), entityIs({ entityId: lastSpell?.entityId, cardId: lastSpell?.cardId })),
					),
					and(side(inputSide), inDeck, spell),
				)(input);
			};
		case CardIds.SuperchargeTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SupremeDinomancy_TLC_828:
			return and(side(inputSide), or(inHand, inDeck, inPlay), beast);
		case CardIds.Surfalopod_VAC_443:
			return and(side(inputSide), inDeck, spell);
		case CardIds.SurvivalOfTheFittest:
			return and(side(inputSide), or(inHand, inDeck, inPlay), minion);
		case CardIds.SwarthySwordshiner_VAC_701:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		case CardIds.SwiftscaleTrickster:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.SwinetuskShank:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				cardIs(
					CardIds.DeadlyPoisonCore,
					CardIds.DeadlyPoisonLegacy,
					CardIds.DeadlyPoisonVanilla,
					CardIds.LeechingPoison_CORE_ICC_221,
					CardIds.LeechingPoison_ICC_221,
					CardIds.NitroboostPoison,
					CardIds.NitroboostPoison_NitroboostPoisonToken,
					CardIds.ParalyticPoison,
					CardIds.SilverleafPoison,
				),
			);
		case CardIds.Switcheroo:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Swordfish:
			return and(side(inputSide), inDeck, pirate);
		case CardIds.SwordOfTheFallen:
			return and(side(inputSide), inDeck, spell, secret);
		case CardIds.SymphonyOfSins_MovementOfPrideToken:
			return (input: SelectorInput): SelectorOutput => {
				const highestCostMinion = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost())[0];
				const highestMinionCost = highestCostMinion?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostEqual(highestMinionCost)),
					and(side(inputSide), inDeck, minion),
				)(input);
			};
		case CardIds.TabletopRoleplayer_TOY_915:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.TaelanFordringCore:
			return (input: SelectorInput): SelectorOutput => {
				const highestCostMinion = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost())[0];
				const highestMinionCost = highestCostMinion?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostEqual(highestMinionCost)),
					and(side(inputSide), inDeck, minion),
				)(input);
			};
		case CardIds.TaethelanBloodwatcher_WW_430:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck, effectiveCostMore(1));
		case CardIds.TaintedRemnant_YOG_519:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.TakeToTheSkies_WW_816:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.TalentedArcanist:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.TamsinsPhylactery:
			return and(side(inputSide), minion, inGraveyard, deathrattle);
		case CardIds.TamsinRoame_BAR_918:
			return and(side(inputSide), or(inHand, inDeck), shadow, spell, effectiveCostMore(0));
		case CardIds.TangledWrath:
			return and(side(inputSide), inDeck, spell);
		case CardIds.TastyFlyfish:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TavishStormpike_BAR_038:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.Techysaurus_DINO_409:
			return and(side(inputSide), or(inHand, inDeck), notInInitialDeck);
		case CardIds.TendingDragonkin_FIR_960:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.TenGallonHat_WW_811:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ToadOfTheWilds:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.TopiorTheShrubbagazzor:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		case CardIds.TerrorscaleStalker:
		case CardIds.TerrorscaleStalker_CORE_UNG_800:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.TessGreymane_GIL_598:
		case CardIds.TessGreymaneCore:
			return tooltip(and(side(inputSide), cardsPlayedThisMatch, fromAnotherClassStrict));
		case CardIds.The8HandsFromBeyond_GDB_477:
			return (input: SelectorInput): SelectorOutput => {
				const orderedByCost = [...input.deckState.deck].sort(
					(a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost(),
				);
				const highest8th =
					orderedByCost.length < 8 ? orderedByCost[orderedByCost.length - 1] : orderedByCost[7];
				const highest8thCost = highest8th?.getEffectiveManaCost() ?? 0;
				const candidates = orderedByCost
					.filter((c) => c.getEffectiveManaCost() >= highest8thCost)
					.map((c) => c.cardId as CardIds);
				return and(side(inputSide), inDeck, cardIs(...candidates))(input);
			};
		case CardIds.TheBoomReaver:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TheBoomship:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.TheCountess:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.TheCurator_KAR_061:
		case CardIds.TheCurator_CORE_KAR_061:
			return and(side(inputSide), inDeck, minion, or(beast, dragon, murloc));
		case CardIds.TheDarkPortal_BT_302:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TheExodar_GDB_120:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.TheFistOfRaDen:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.TheFoodChain_TLC_830:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), beast, attackIs(1)),
				and(side(inputSide), or(inDeck, inHand), beast, attackIs(3)),
				and(side(inputSide), or(inDeck, inHand), beast, attackIs(5)),
				and(side(inputSide), or(inDeck, inHand), beast, attackIs(7)),
			);
		case CardIds.TheForbiddenSequence_TLC_460:
		case CardIds.TheForbiddenSequence_TheOriginStoneToken_TLC_460t:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.ExarchHataaru_TheGalaxysLensToken_GDB_136t:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.TheGardensGrace:
			return and(side(inputSide), or(inDeck, inHand), spell, holy);
		case CardIds.ThePurator:
			return and(side(inputSide), inDeck, minion, not(tribeless));
		case CardIds.Therazane_DEEP_036:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.TheStoneOfJordanTavernBrawlToken:
			return and(side(inputSide), inDeck, spell);
		case CardIds.TheStonewright:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.TheUpperHand:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ThingFromBelow:
		case CardIds.ThingFromBelowCore:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.ThirstyDrifter_WW_387:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(1));
		case CardIds.Thor_SC_414:
		case CardIds.Thor_ThorExplosivePayloadToken_SC_414t:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.Thoribelore:
			return and(side(inputSide), or(inDeck, inHand), spell, fire);
		case CardIds.ThornmantleMusician:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.ThriveInTheShadowsCore:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Thunderbringer_WW_440:
			return and(side(inputSide), inDeck, or(elemental, beast));
		case CardIds.TidelostBurrower:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.TidepoolPupil_VAC_304:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.TidePools_VAC_522:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.TimberTambourine:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostMore(4));
		case CardIds.TimelineAccelerator_WON_139:
			return and(side(inputSide), inDeck, mech);
		case CardIds.Timewarden:
			return and(side(inputSide), or(inDeck, inHand), minion, dragon);
		case CardIds.TimewinderZarimi_TOY_385:
			return and(side(inputSide), or(inDeck, inHand), minion, dragon);
		case CardIds.TinyfinsCaravan:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.TinyWorldbreaker_YOG_527:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.TogwagglesScheme:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.TombLurker_CORE_ICC_098:
		case CardIds.TombLurker_ICC_098:
			return and(side(inputSide), inGraveyard, minion, deathrattle);
		case CardIds.TombTraitor:
			return and(side(inputSide), inDeck, or(isPlague, generatesPlague));
		case CardIds.TorethTheUnbreaking_EDR_258:
			return and(side(inputSide), or(inDeck, inHand), divineShield);
		case CardIds.Torga_TLC_102:
			return and(side(inputSide), inDeck, kindred);
		case CardIds.TormentedDreadwing_EDR_572:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.TortollanPilgrim:
			return and(side(inputSide), inDeck, spell);
		case CardIds.TortollanStoryteller_TLC_254:
			return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
		case CardIds.TortollanTraveler_VAC_518:
			return and(side(inputSide), inDeck, minion, taunt, not(cardIs(CardIds.TortollanTraveler_VAC_518)));
		case CardIds.TotemicMightLegacy:
		case CardIds.TotemicMightVanilla:
		case CardIds.TotemicSurge:
			return and(side(inputSide), or(inDeck, inHand), minion, totem);
		case CardIds.TotemOfTheDead_LOOTA_845:
			return and(side(inputSide), deathrattle);
		case CardIds.TownCrier_GIL_580:
		case CardIds.TownCrier_CORE_GIL_580:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.TramConductorGerry_WW_437:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.TramHeist_WW_053:
			return tooltip(and(opposingSide(inputSide), cardsPlayedLastTurn));
		case CardIds.TramOperator:
			return and(side(inputSide), inDeck, minion, mech);
		case CardIds.TravelmasterDungar_WORK_043:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TreasureDistributor_TOY_518:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.TreasureHunterEudora_VAC_464:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.TrenchSurveyor_TSC_642:
			return and(side(inputSide), inDeck, minion, mech);
		case CardIds.TrialOfTheJormungars_WON_028:
			return and(side(inputSide), inDeck, beast, effectiveCostLess(4));
		case CardIds.Triangulate_GDB_451:
			return and(side(inputSide), inDeck, spell, not(cardIs(CardIds.Triangulate_GDB_451)));
		case CardIds.TrinketArtist_TOY_882:
			return highlightConditions(
				and(side(inputSide), inDeck, and(minion, divineShield)),
				and(side(inputSide), inDeck, aura),
			);
		case CardIds.TrinketTracker:
			return and(side(inputSide), inDeck, spell, effectiveCostEqual(1));
		case CardIds.TrolleyProblem_WW_436:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.TroubledMechanic_GDB_463:
			return and(side(inputSide), inDeck, draenei);
		case CardIds.TrustyCompanion_WW_027:
			return and(side(inputSide), inDeck, minion, not(tribeless));
		case CardIds.TrustyFishingRod_VAC_960:
			return and(side(inputSide), inDeck, minion, effectiveCostEqual(1));
		case CardIds.Turbulus_WORK_013:
			return and(side(inputSide), or(inDeck, inHand), minion, battlecry);
		case CardIds.Tyr:
			return tooltip(
				and(side(inputSide), inGraveyard, currentClass, minion, attackGreaterThan(1), attackLessThan(5)),
			);
		case CardIds.TyrsTears:
		case CardIds.TyrsTears_TyrsTearsToken:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), currentClass, minion),
				tooltip(and(side(inputSide), inGraveyard, currentClass, minion)),
			);
		case CardIds.Tyrande_EDR_464:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Tuskpiercer:
		case CardIds.Tuskpiercer_CORE_BAR_330:
			return and(side(inputSide), inDeck, deathrattle, minion);
		case CardIds.TwilightDeceptor:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.TwilightGuardian:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TwilightsCall:
			return and(side(inputSide), inGraveyard, minion, deathrattle);
		case CardIds.TwinbowTerrorcoil:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.TwistedTether:
			return and(side(inputSide), inHand, undead);
		case CardIds.UmpiresGrasp_TOY_641:
			return and(side(inputSide), inDeck, demon);
		case CardIds.UnchainedGladiator:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.UnderbrushTracker_TLC_520:
			return and(side(inputSide), or(inHand, inDeck), shufflesCardIntoDeck);
		case CardIds.UnderTheSea_VAC_431:
			return and(side(inputSide), inDeck, spell, not(cardIs(CardIds.UnderTheSea_VAC_431)));
		case CardIds.UndyingAllies:
			return and(side(inputSide), or(inDeck, inHand), minion, undead);
		case CardIds.UnearthedArtifacts_TLC_462:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.UnearthedRaptor:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.UnendingSwarm:
			return tooltip(and(side(inputSide), inGraveyard, minion, effectiveCostLess(3)));
		case CardIds.UngoroBrochure_WORK_050:
			return and(side(inputSide), inDeck, minion);
		// case CardIds.UnleashTheColossus:
		// case CardIds.GorishiColossus:
		// 	return and(side(inputSide), or(inDeck, inHand), canDealExactDamage(2));
		case CardIds.UnlivingChampion:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.UnlockedPotential:
			return and(side(inputSide), or(inDeck, inHand), minion, healthBiggerThanAttack);
		case CardIds.UnluckyPowderman_WW_367:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.UnstableMagicTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, arcane);
		case CardIds.UntappedPotential:
		case CardIds.UntappedPotential_OssirianTear:
			return and(side(inputSide), or(inDeck, inHand), chooseOne);
		case CardIds.UnyieldingVindicator_GDB_232:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.UrchinSpines:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		case CardIds.Ursatron:
			return and(side(inputSide), inDeck, mech);
		case CardIds.UrsineMaul_EDR_253:
			return (input: SelectorInput): SelectorOutput => {
				const highestCostMinion = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost())[0];
				const highestMinionCost = highestCostMinion?.getEffectiveManaCost() ?? 0;
				return highlightConditions(
					and(side(inputSide), inDeck, minion, effectiveCostEqual(highestMinionCost)),
					and(side(inputSide), inDeck, minion),
				)(input);
			};
		case CardIds.Ursol_EDR_259:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ValstannStaghelm_WON_345:
			return and(side(inputSide), inDeck, minion, taunt);
		case CardIds.VanndarStormpike_AV_223:
			return !!card
				? and(side(inputSide), inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() + 1))
				: null;
		case CardIds.VarianKingOfStormwind:
			return highlightConditions(
				and(side(inputSide), inDeck, rush),
				and(side(inputSide), inDeck, taunt),
				and(side(inputSide), inDeck, divineShield),
			);
		case CardIds.VarianWrynn_AT_072:
			return and(side(inputSide), inDeck, minion);
		case CardIds.VaultBreaker_TLC_483:
			return and(side(inputSide), or(inHand, inDeck), discover);
		case CardIds.Vectus:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), inGraveyard, minion, deathrattle),
			);
		case CardIds.VelarokWindblade_WW_364:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.VelenLeaderOfTheExiled_GDB_131:
			return (input: SelectorInput): SelectorOutput => {
				const candidates = input.deckState.cardsPlayedThisMatch
					.filter((c) => c.cardId !== CardIds.VelenLeaderOfTheExiled_GDB_131)
					.filter(
						(c) =>
							allCards.getCard(c.cardId).races?.includes(Race[Race.DRAENEI]) ||
							allCards.getCard(c.cardId).races?.includes(Race[Race.ALL]),
					)
					.filter(
						(c) =>
							allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.BATTLECRY]) ||
							allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.DEATHRATTLE]),
					);
				return highlightConditions(
					tooltip(
						and(
							side(inputSide),
							entityIs(...candidates.map((c) => ({ entityId: c.entityId, cardId: c.cardId }))),
						),
					),
					and(side(inputSide), or(inDeck, inHand), draenei, or(battlecry, deathrattle)),
				)(input);
			};
		case CardIds.VelensChosen:
			return and(side(inputSide), or(inHand, inDeck), spell, damage);
		case CardIds.Vendetta:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.VeteranWarmedic:
			return and(side(inputSide), or(inHand, inDeck), holy, spell);
		case CardIds.VengefulSpirit_BAR_328:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.VengefulWalloper:
			return and(side(inputSide), or(inHand, inDeck), outcast);
		case CardIds.Vexallus:
			return and(side(inputSide), or(inDeck, inHand), spell, arcane);
		case CardIds.ViciousBloodworm_RLK_711:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ViciousSlitherspear_TSC_827:
		case CardIds.ViciousSlitherspear_CORE_TSC_827:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.VioletTreasuregill_TLC_438:
			return and(side(inputSide), inDeck, spell, effectiveCostLess(3));
		case CardIds.Viper_SC_018:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.VirmenSensei_CFM_816:
		case CardIds.VirmenSensei_WON_300:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.VitalitySurge:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Voidcaller:
		case CardIds.VoidcallerCore:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.VoidFlayer:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.VolcanicThrasher_TLC_223:
			return and(side(inputSide), inDeck, fire, spell);
		case CardIds.VolumeUp:
			return and(side(inputSide), inDeck, spell);
		case CardIds.VulperaToxinblade:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		case CardIds.WailingVapor:
		case CardIds.WailingVapor_CORE_WC_042:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.WakenerOfSouls_GDB_468:
			return highlightConditions(
				tooltip(
					and(side(inputSide), inGraveyard, deathrattle, minion, not(cardIs(CardIds.WakenerOfSouls_GDB_468))),
				),
				and(side(inputSide), deathrattle, minion, not(cardIs(CardIds.WakenerOfSouls_GDB_468))),
			);
		case CardIds.WallowTheWretched_EDR_487:
			return and(side(inputSide), or(inHand, inDeck), darkGift);
		case CardIds.WarCommandsTavernBrawl:
			return and(side(inputSide), inDeck, minion, neutral, effectiveCostLess(4));
		case CardIds.WarpDrive_GDB_474:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.WarpGate_SC_751:
			return and(side(inputSide), or(inHand, inDeck), protoss, minion);
		case CardIds.WayOfTheShell_TLC_513hp:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.Zuljin:
			return and(side(inputSide), or(inDeck, inHand), spell /*, generateSecret */);
		case CardIds.Zuljin_WarriorsOfAmani_THD_010p:
			return and(side(inputSide), or(inDeck, inHand), secret /*, generateSecret */);
		case CardIds.WarsongCommander_CORE_EX1_084:
		case CardIds.WarsongCommanderLegacy:
		case CardIds.WarsongCommanderVanilla:
			return and(side(inputSide), or(inHand, inDeck), minion, attackLessThan(4));
		case CardIds.WarsongWrangler:
			return and(side(inputSide), inDeck, beast);
		case CardIds.WarsongWrangler:
			return and(side(inputSide), inDeck, beast);
		case CardIds.WatercolorArtist_TOY_376:
			return and(side(inputSide), inDeck, spell, frost);
		case CardIds.WeaponsAttendant_VAC_924:
			return highlightConditions(and(side(inputSide), inDeck, weapon), and(side(inputSide), inDeck, pirate));
		case CardIds.WeaponsExpert:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.WeaverOfTheCycle_EDR_472:
			return and(side(inputSide), or(inDeck, inHand), spell, costMore(4));
		case CardIds.WebOfDeception_EDR_523:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Whirlweaver:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Wither:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.WickedWitchdoctor:
		case CardIds.WickedWitchdoctor_WON_083:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.WidowbloomSeedsman:
			return and(side(inputSide), inDeck, spell, nature);
		case CardIds.WildPyromancerCore:
		case CardIds.WildPyromancerLegacy:
		case CardIds.WildPyromancerVanilla:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.WildSpirits:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				cardIs(
					CardIds.SpiritPoacher_FoxSpiritWildseedToken,
					CardIds.SpiritPoacher_BearSpiritWildseedToken,
					CardIds.SpiritPoacher_StagSpiritWildseedToken,
					CardIds.SpiritPoacher,
					CardIds.WildSpirits,
					CardIds.Aralon_REV_363,
					CardIds.Aralon_REV_780,
					CardIds.StagCharge,
				),
			);
		case CardIds.WindsweptPageturner_TLC_220:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.WingCommander:
			return and(side(inputSide), or(inDeck, inHand), minion, dragon);
		case CardIds.WingCommanderIchman_AV_336:
			return and(side(inputSide), inDeck, minion, beast);
		case CardIds.WishOfTheNewMoon_EDR_460:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.WitchingHour:
			return and(side(inputSide), inGraveyard, minion, beast);
		case CardIds.WitherTheWeakTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.WoodlandWonders_TOY_804:
			return and(side(inputSide), or(inDeck, inHand), spellDamage);
		case CardIds.WorkshopJanitor_TOY_891:
			return and(side(inputSide), or(inDeck, inHand), locationExtended);
		case CardIds.WrathspineEnchanter:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), spell, fire),
				and(side(inputSide), or(inDeck, inHand), spell, nature),
				and(side(inputSide), or(inDeck, inHand), spell, frost),
			);
		case CardIds.WreckemAndDeckem_TOY_603:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.WretchedExile:
			return and(side(inputSide), or(inDeck, inHand), outcast);
		case CardIds.Xb931Housekeeper_VAC_956:
			return and(side(inputSide), or(inDeck, inHand), locationExtended);
		case CardIds.WyrmrestPurifier:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.Xyrella_BAR_735:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.XyrellaTheDevout:
			return and(side(inputSide), inGraveyard, minion, deathrattle);
		case CardIds.YellingYodeler:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.YouthfulBrewmaster:
		case CardIds.YouthfulBrewmasterCore:
		case CardIds.YouthfulBrewmasterLegacy:
		case CardIds.YouthfulBrewmasterVanilla:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.YoggInTheBox_TOY_372:
			return and(side(inputSide), inDeck, minion);
		case CardIds.YoggSaronHopesEnd_OG_134:
		case CardIds.YoggSaronMasterOfFate:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.YshaarjTheDefiler:
			return and(side(inputSide), cardsPlayedThisMatch, corrupted);
		case CardIds.YshaarjRageUnbound:
			return and(side(inputSide), inDeck, minion);

		// Unsorted
		case CardIds.BlackjackStunner:
		case CardIds.CloakedHuntress_KAR_006:
		case CardIds.CloakedHuntress_CORE_KAR_006:
		case CardIds.PettingZoo:
		case CardIds.CommanderRhyssa:
		case CardIds.SparkjoyCheat:
		case CardIds.Halkias:
		case CardIds.OrionMansionManager:
		case CardIds.ProfessorPutricide_ICC_204:
		case CardIds.ProfessorPutricide_CORE_ICC_204:
		case CardIds.SaygeSeerOfDarkmoon:
		case CardIds.StarstrungBow:
		case CardIds.ContractConjurer:
		case CardIds.LesserEmeraldSpellstone:
		case CardIds.LesserEmeraldSpellstone_EmeraldSpellstoneToken:
		case CardIds.LesserEmeraldSpellstone_GreaterEmeraldSpellstoneToken:
		case CardIds.CannonmasterSmythe_BAR_879:
		case CardIds.PhaseStalker:
		case CardIds.MedivhsValet:
		case CardIds.ApexisSmuggler:
		case CardIds.ArcaneFlakmage:
		case CardIds.InconspicuousRider:
		case CardIds.SecretkeeperVanilla:
		case CardIds.SecretkeeperLegacy:
			return and(side(inputSide), or(inHand, inDeck), spell, secret);
		case CardIds.ArcaneBreath:
		case CardIds.SandBreath_DRG_233:
		case CardIds.TwilightWhelp:
		case CardIds.CorrosiveBreath:
		case CardIds.FiretreeWitchdoctor:
		case CardIds.NetherspiteHistorian:
		case CardIds.NetherspiteHistorian_CORE_KAR_062:
		case CardIds.WyrmrestAgent:
		case CardIds.BreathOfTheInfinite:
		case CardIds.Duskbreaker_LOOT_410:
		case CardIds.MoltenBreath:
		case CardIds.CrazedNetherwing:
		case CardIds.DragonfirePotion:
		case CardIds.FyeTheSettingSun_WW_825:
		case CardIds.Chronobreaker:
		case CardIds.AlexstraszasChampion:
		case CardIds.DragonmawSentinel:
		case CardIds.DragonriderTalritha_DRG_235:
		case CardIds.LightningBreath:
		case CardIds.CandleBreath:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.GrimscaleOracleLegacy:
		case CardIds.GrimscaleOracleVanilla:
		case CardIds.GrimscaleChum:
		// case CardIds.MurlocTidecaller:
		case CardIds.MurlocTidecallerCore:
		case CardIds.MurlocTidecallerVanilla:
		case CardIds.MurlocTidecallerLegacy:
		case CardIds.Toxfin_DAL_077:
		case CardIds.UniteTheMurlocs:
		case CardIds.LushwaterMurcenary:
		case CardIds.PrimalfinLookout_UNG_937:
		case CardIds.RockpoolHunter_UNG_073:
		case CardIds.BloodscentVilefin:
		case CardIds.Clownfish:
		case CardIds.ColdlightSeerCore:
		case CardIds.ColdlightSeerLegacy_EX1_103:
		case CardIds.ColdlightSeerVanilla:
		case CardIds.NofinCanStopUs:
		case CardIds.GentleMegasaur_UNG_089:
		case CardIds.EveryfinIsAwesome:
		case CardIds.MurlocWarleaderCore:
		case CardIds.MurlocWarleaderLegacy_EX1_507:
		case CardIds.MurlocWarleaderVanilla:
		case CardIds.Voidgill:
		case CardIds.SouthCoastChieftain:
		case CardIds.SiltfinSpiritwalker:
		case CardIds.UnderbellyAngler:
			return and(side(inputSide), or(inHand, inDeck), murloc);
		case CardIds.ShiverTheirTimbers:
		case CardIds.ToyBoat_TOY_505:
		case CardIds.Skybarge:
		case CardIds.MrSmite_DED_006:
		case CardIds.PirateAdmiralHooktusk:
			return and(side(inputSide), or(inHand, inDeck), pirate);
	}
	return null;
};

const hasTaunt = (cardId: string, entityId: number, deckState: DeckState, allCards: CardsFacadeService): boolean => {
	const result =
		getProcessedCard(cardId, entityId, deckState, allCards).mechanics?.includes(GameTag[GameTag.TAUNT]) ?? false;
	return result;
};
