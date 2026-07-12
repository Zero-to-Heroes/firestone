// Lab Constructor (TTN_730): At the end of your turn, summon a copy of this. Forge: Gain Magnetic.

import { CardClass, CardIds, CardType, GameTag, Race, SpellSchool } from '@firestone-hs/reference-data';
import { pickLast, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { ShortCard } from '../../models/game-state';
import { getCost, getProcessedCard } from '../card-utils';
import { getEntityTag } from '../parser-entity-utils';
import { Selector, SelectorInput, SelectorOutput } from './cards-highlight-common.service';
import {
	and,
	animalCompanionSynergyDeckSelector,
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
	copiedFromOpponent,
	corrupt,
	corrupted,
	costHealth,
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
	divineShieldStrict,
	dormant,
	draenei,
	dragon,
	dredge,
	effectiveCostEqual,
	effectiveCostEven,
	effectiveCostLess,
	effectiveCostLessThanRemainingMana,
	effectiveCostMore,
	effectiveCostOdd,
	elemental,
	endOfTurn,
	entityIs,
	excavate,
	fel,
	felStrict,
	fire,
	forge,
	freeze,
	frenzy,
	fromAnotherClass,
	fromAnotherClassStrict,
	fromLatestExpansion,
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
	herald,
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
	isConcoctionRelated,
	isPlague,
	isSi7,
	kindred,
	lastAffectedByCardId,
	legendary,
	leylineFranchiseSynergyDeckSelector,
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
	rafaam,
	reborn,
	relic,
	restoreHealth,
	restoreHealthStrict,
	restoreHealthToMinion,
	rewind,
	rush,
	secret,
	secretsTriggeredThisMatch,
	selfDamageHero,
	shadow,
	shufflesCardIntoDeck,
	side,
	silverHandRecruitSynergyDeckSelector,
	spell,
	spellDamage,
	spellExtended,
	spellPlayedThisMatch,
	spellPlayedThisMatchOnFriendly,
	spellSchool,
	spellSchoolPlayedThisMatch,
	spendCorpse,
	starshipExtended,
	taunt,
	templar,
	terran,
	tooltip,
	totem,
	tradeable,
	treant,
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
	entityId: number | null,
	card: DeckCard | null | undefined,
	inputSide: HighlightSide,
	allCards: CardsFacadeService,
): Selector | null => {
	switch (cardId) {
		case CardIds.AbsorbentParasite:
			return and(side(inputSide), or(inDeck, inHand), minion, or(mech, beast));
		case CardIds.AbyssalBassist:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.AbyssalDepths:
			return (input: SelectorInput): SelectorOutput => {
				const cheapestMinions = input.deckState.deck
					.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
					.sort((a, b) => (a.getEffectiveManaCost() ?? 0) - (b.getEffectiveManaCost() ?? 0))
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
		case CardIds.AthleticStudies_SCH_237:
			return and(side(inputSide), or(inDeck, inHand), minion, rush);
		case CardIds.AegwynnTheGuardianCore:
		case CardIds.AegwynnTheGuardian_LEG_CS3_001:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Aeroponics:
			return and(side(inputSide), or(inHand, inDeck), treant);
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
			return and(side(inputSide), demon);
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
			return and(side(inputSide), or(inDeck, inHand), dragon);
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
			return and(side(inputSide), inDeck, pirate);
		// Anchorite: Whenever another minion is Overhealed, give it that much extra Health.
		case CardIds.Anchorite_GDB_441:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthToMinion),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		// Ancient Krakenbane: Battlecry: If you've cast three spells while holding this, deal 5 damage.
		case CardIds.AncientKrakenbane:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.AncientMysteries:
			return and(side(inputSide), inDeck, secret);
		case CardIds.AncientOfGrowth:
		case CardIds.AncientOfGrowth_AncientGrowth:
			return and(side(inputSide), or(inDeck, inHand), treant);
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
		// Animated Moonwell: After you cast a spell, gain Attack equal to its Cost.
		case CardIds.AnimatedMoonwell_EDR_254:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
			return and(side(inputSide), inDeck, elemental);
		case CardIds.ArcaneArtificer:
		// Arcane Artificer: Whenever you cast a spell, gain Armor equal to its Cost.
		case CardIds.ArcaneArtificerCore:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Arcane Anomaly: After you cast a spell, give this minion +1 Health.
		case CardIds.ArcaneAnomaly_KAR_036:
		case CardIds.ArcaneAnomaly_CORE_KAR_036:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ArcaneBrilliance:
			return and(
				side(inputSide),
				inDeck,
				spell,
				or(effectiveCostEqual(7), effectiveCostEqual(8), effectiveCostEqual(9), effectiveCostEqual(10)),
			);
		case CardIds.ArcaneFluxTavernBrawl:
			return and(side(inputSide), arcane);
		case CardIds.ArcaneLuminary:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.ArcaneQuiver_RLK_817:
			return highlightConditions(and(side(inputSide), inDeck, arcane), and(side(inputSide), inDeck, spell));
		case CardIds.ArcaniteCrystalTavernBrawl:
			return and(side(inputSide), arcane);
		case CardIds.Arcanologist:
			return and(side(inputSide), inDeck, secret);
		case CardIds.ArcanologistCore:
			return and(side(inputSide), inDeck, secret);
		case CardIds.ArchdruidOfThorns_EDR_491:
			return and(side(inputSide), or(inHand, inDeck), deathrattle, minion);
		case CardIds.AcherusVeteran_ICC_092:
		case CardIds.AcherusVeteran_CORE_ICC_092:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Archimonde_GDB_128:
			return and(side(inputSide), or(inDeck, inHand, inGraveyard), demon, notInInitialDeck);
		case CardIds.ArchmageAntonidas:
		case CardIds.ArchmageAntonidasLegacy:
		// Archmage Antonidas: Whenever you cast a spell, add a 'Fireball' spell to your hand.
		case CardIds.ArchmageAntonidas_CORE_EX1_559:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.ArchmageKalec_CATA_458:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended, dealsDamage),
				and(side(inputSide), or(inHand, inDeck), spellExtended),
			);
		// Archmage Vargoth: At the end of your turn, cast a spell you've cast this turn (targets are random).
		case CardIds.ArchmageVargoth:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		// Arrow Smith: After you cast a spell, deal 1 damage to the lowest Health enemy.
		case CardIds.ArrowSmith:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		// Auchenai Phantasm: Battlecry: This turn, your healing effects deal damage instead.
		case CardIds.AuchenaiPhantasm:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthStrict),
				and(side(inputSide), or(inDeck, inHand), lifesteal),
			);
		// Atiesh the Greatstaff: Costs (0) if you control Medivh. Double the damage and healing of your spells.
		case CardIds.MedivhTheHallowed_AtieshTheGreatstaffToken_TIME_890t:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand, inPlay), cardIs(CardIds.MedivhTheHallowed_TIME_890)),
				and(side(inputSide), or(inDeck, inHand), spellExtended, or(restoreHealth, dealsDamage)),
			);
		case CardIds.AuchenaiDeathSpeaker_GDB_469:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), minion, reborn),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		// Auchenai Soulpriest: Your cards and powers that restore Health now deal damage instead.
		case CardIds.AuchenaiSoulpriestLegacy:
		case CardIds.AuchenaiSoulpriestVanilla:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthStrict),
				and(side(inputSide), or(inDeck, inHand), lifesteal),
			);
		case CardIds.AuctionhouseGavel:
			return and(side(inputSide), or(inDeck, inHand), battlecry, minion);
		case CardIds.AudioSplitter:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.Aviana:
		case CardIds.Aviana_WON_012:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AwakenTheMakers:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.AwakenTheFlame_THD_029hp:
		case CardIds.AwakenTheFlame:
			return and(side(inputSide), or(inDeck, inHand), imbue);
		case CardIds.AxeBerserker:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.AzeriteGiant_WW_025:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.AzsharanGardens_SunkenGardensToken:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.AzsharanSaber_SunkenSaberToken:
			return and(side(inputSide), inDeck, beast);
		case CardIds.AzsharanScavenger_SunkenScavengerToken:
			return and(side(inputSide), murloc);
		// Azure Queen Sindragosa: Fabled If you control another Dragon, your Arcane spells cost (2) less.
		case CardIds.AzureQueenSindragosa_TIME_852:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), dragon),
				and(side(inputSide), or(inDeck, inHand), arcane, spellExtended),
			);
		// Azure King Malygos: If you control another Dragon, your Arcane spells cast twice.
		case CardIds.AzureQueenSindragosa_AzureKingMalygosToken_TIME_852t1:
			return and(side(inputSide), or(inDeck, inHand), arcane, spellExtended);
		// Baba Naga: Battlecry: If you've cast a spell while holding this, deal 3 damage.
		case CardIds.BabaNaga:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.BackstageBouncer:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BadlandsBrawler_WW_349:
			return and(side(inputSide), or(inDeck, inHand, inOther), excavate);
		case CardIds.BadOmen_GDB_124:
			return and(side(inputSide), or(inDeck, inHand, inOther), starshipExtended);
		case CardIds.BalefulBlazer_CATA_EVENT_002:
			return and(side(inputSide), or(inHand, inDeck), spell, fire);
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
		case CardIds.BatMask_DINO_402:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BattlefieldBlaster_CATA_209:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), spell, dealsDamage),
				and(side(inputSide), or(inDeck, inHand), spell),
			);
		case CardIds.Battlepickaxe_WW_347:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.BattleTotem_LOOTA_846:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		case CardIds.BeanstalkBrute_EDR_230:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BeastmasterLeoroxx:
			return and(side(inputSide), or(inHand, inDeck), beast);
		// Bestial Madness (YOG_505): "Give +1 Attack to all minions in your hand, deck, and battlefield."
		case CardIds.BestialMadness_YOG_505:
			return and(side(inputSide), or(inDeck, inHand, inPlay), minion);
		case CardIds.BeckoningBicornTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.ArchVillainRafaam_BeholdMyStuff_THD_032p:
			return and(side(inputSide), or(inDeck, inHand), legendary);
		case CardIds.ArchwitchWillow:
		case CardIds.ArchwitchWillow_CORE_SCH_181:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.BenevolentBanker_WW_384:
			return and(inDeck, spell);
		case CardIds.HagathaTheWitch_BewitchHeroic:
			return and(side(inputSide), or(inDeck, inHand), minion);
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
				and(side(inputSide), or(inHand, inDeck), fire),
				and(side(inputSide), or(inHand, inDeck), elemental),
			);
		case CardIds.Finality_BlessingOfTheInfinite_END_003p:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.BlessingOfTheWolf_EDR_850p:
			return and(side(inputSide), or(inDeck, inHand), beast);
		// Blindeye Sharpshooter: After you play a Naga, deal 2 damage to a random enemy and draw a spell. (Then switch!) / After you cast a spell, deal 2 damage to a random enemy and draw a Naga.
		case CardIds.BlindeyeSharpshooter_WW_402:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), naga),
				and(side(inputSide), or(inDeck, inHand), spell),
			);
		case CardIds.Blink_SC_761:
			return and(side(inputSide), inDeck, protoss, minion);
		// Bloodbloom: The next spell you cast this turn costs Health instead of Mana.
		case CardIds.Bloodbloom:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.BloodCrusader:
			return and(side(inputSide), or(inDeck, inHand), paladin, minion);
		case CardIds.BloodMoonTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.BloodOfGhuun:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BloodreaverGuldan_CORE_ICC_831:
		case CardIds.BloodreaverGuldan_ICC_831:
			return and(side(inputSide), inGraveyard, demon);
		case CardIds.BobTheBartender_BG31_BOB:
		case CardIds.BobTheBartender_FindATripleToken_BG31_BOBt4:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Bolster:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		case CardIds.BolvarFireblood_ICC_858:
		case CardIds.BolvarFireblood_CORE_ICC_858:
			return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
		case CardIds.Bonecaller:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), undead),
				and(side(inputSide), inGraveyard, undead),
			);
		case CardIds.BoneFlinger:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.BonecrusherTavernBrawlToken:
			return tooltip(and(side(inputSide), inGraveyard, minion, deathrattle));
		case CardIds.BonfireElemental:
			return and(side(inputSide), or(inHand, inDeck), elemental);
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
		case CardIds.BronzeBroodmother:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		// Brittlebone Destroyer: Battlecry: If your hero's Health changed this turn, destroy a minion.
		case CardIds.BrittleboneDestroyer:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		// Broll Bearmantle: After you cast a spell, summon a random Animal Companion.
		case CardIds.BrollBearmantle_EDR_853:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.BronzeSignetTavernBrawl:
			return and(side(inputSide), inDeck, minion);
		case CardIds.BroodKeeper_EDR_457:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.Broxigar_AxeOfCenariusToken_TIME_020t1:
			return and(
				side(inputSide),
				inDeck,
				cardIs(
					CardIds.Broxigar_FirstPortalToArgusToken_TIME_020t2,
					CardIds.Broxigar_SecondPortalToArgusToken_TIME_020t3,
					CardIds.Broxigar_ThirdPortalToArgusToken_TIME_020t4,
					CardIds.Broxigar_FinalPortalToArgusToken_TIME_020t5,
				),
			);
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
			return and(side(inputSide), inDeck, hasSpellSchool);
		case CardIds.CabaretHeadliner_VAC_954:
			return and(side(inputSide), inDeck, hasSpellSchool);
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
					.sort((a, b) => (a.getEffectiveManaCost() ?? 0) - (b.getEffectiveManaCost() ?? 0))[0];
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
		case CardIds.CaliaMenethil_CORE_CATA_002:
			return and(side(inputSide), inGraveyard, minion);
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
					(a, b) => (b.getEffectiveManaCost() ?? 0) - (a.getEffectiveManaCost() ?? 0),
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
		case CardIds.CardboardGolem_TOY_809:
			return and(side(inputSide), or(inDeck, inHand), aura);
		// Card Grader: Battlecry: If you've cast a spell while holding this, Discover a card from your deck.
		case CardIds.CardGrader_TOY_054:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
			return and(side(inputSide), or(inHand, inDeck), hasSpellSchool);
		case CardIds.CarrionStudies:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.CastleKennels_REV_362:
		case CardIds.CastleKennels_REV_790:
			return and(side(inputSide), inDeck, beast);
		case CardIds.CatrinaMuerteCore:
		case CardIds.CatrinaMuerte:
			return highlightConditions(
				and(side(inputSide), inGraveyard, undead, minion),
				and(side(inputSide), or(inHand, inDeck), undead),
			);
		case CardIds.CattleRustler_WW_351:
			return and(side(inputSide), inDeck, beast);
		// Celestial Shot: Deal $3 damage. Your next spell has Spell Damage +2.
		case CardIds.CelestialShot_YOG_082:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, dealsDamage);
		case CardIds.CenarionHold_WON_015:
			return and(side(inputSide), or(inHand, inDeck), chooseOne);
		case CardIds.ChainedGuardian:
			return and(side(inputSide), or(inHand, inDeck), generatesPlague);
		case CardIds.ChalkArtist_TOY_388:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ChaosSupplicant_CATA_786:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ChampionOfStorms:
			return and(side(inputSide), or(inHand, inDeck), nature);
		case CardIds.CharredChameleon_FIR_908:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.ChattyBartender:
			return and(side(inputSide), inDeck, secret);
		// Chatty Macaw: Battlecry: Repeat the last spell you cast at an enemy (at a random enemy if possible).
		case CardIds.ChattyMacaw_VAC_407:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		case CardIds.Chromie_TIME_103:
			return (input: SelectorInput): SelectorOutput => {
				const candidates = input.deckState.cardsPlayedThisMatch;
				return and(side(inputSide), inDeck, cardIs(...candidates.map((c) => c.cardId as CardIds)))(input);
			};
		case CardIds.ChronicleKeeper_TIME_062:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.ChronoBoost_SC_750:
			return and(side(inputSide), inDeck, protoss);
		case CardIds.Chronogor_TIME_032:
			return (input: SelectorInput): SelectorOutput => {
				const sorted = [...input.deckState.deck]
					.filter((e) => e.cardId !== CardIds.Chronogor_TIME_032)
					.filter((e) => e.getEffectiveManaCost() != null)
					.sort((a, b) => b.getEffectiveManaCost()! - a.getEffectiveManaCost()!);

				const highestCostMinion = sorted[0];
				const highestMinionCost = highestCostMinion?.getEffectiveManaCost() ?? 0;
				const highestCostFilters = [effectiveCostEqual(highestMinionCost)];
				const highestCostMinions = sorted.filter((e) => e.getEffectiveManaCost() === highestMinionCost);
				if (highestCostMinions.length === 1) {
					const newSorted = sorted.filter((e) => e.getEffectiveManaCost() !== highestMinionCost);
					const secondHighestCostMinion = newSorted[0];
					const secondHighestMinionCost = secondHighestCostMinion?.getEffectiveManaCost() ?? 0;
					highestCostFilters.push(effectiveCostEqual(secondHighestMinionCost));
				}

				const lowestCostMinion = sorted[sorted.length - 1];
				const lowestMinionCost = lowestCostMinion?.getEffectiveManaCost() ?? 0;
				const lowestCostFilters = [effectiveCostEqual(lowestMinionCost)];
				const lowestCostMinions = sorted.filter((e) => e.getEffectiveManaCost() === lowestMinionCost);
				if (lowestCostMinions.length === 1) {
					const newSorted = sorted.filter((e) => e.getEffectiveManaCost() !== lowestMinionCost);
					const secondLowestCostMinion = newSorted[newSorted.length - 1];
					const secondLowestMinionCost = secondLowestCostMinion?.getEffectiveManaCost() ?? 0;
					lowestCostFilters.push(effectiveCostEqual(secondLowestMinionCost));
				}

				return highlightConditions(
					and(side(inputSide), inDeck, or(...lowestCostFilters)),
					and(side(inputSide), inDeck, or(...highestCostFilters)),
				)(input);
			};
		case CardIds.ChronoLordDeios_TIME_064:
			return and(side(inputSide), or(inDeck, inHand), or(battlecry, deathrattle, endOfTurn));
		case CardIds.Cindersword_FIR_922:
			return and(side(inputSide), or(inHand, inDeck), darkGift);
		case CardIds.ClassActionLawyer:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.ClawMachine:
			return and(side(inputSide), inDeck, minion);
		// Cleansing Cleric: Battlecry: Your healing effects restore 2 more Health this game.
		case CardIds.CleansingCleric_CATA_216:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.ClearancePromoter_TOY_390:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ClearTheWay:
			return and(side(inputSide), or(inHand, inDeck), minion, rush);
		// Cleric of An'she: Battlecry: If you've restored Health this turn, Discover a spell from your deck.
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
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.CliffDive_VAC_926:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ClimacticNecroticExplosion:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.ClimbingHook_VAC_932:
			return and(side(inputSide), or(inDeck, inHand), minion, attackGreaterThan(4));
		case CardIds.ClockworkAssistant_GILA_907:
		case CardIds.ClockworkAssistant_ONY_005ta11:
		case CardIds.ClockworkAssistantTavernBrawl_PVPDR_SCH_Active48:
		// Clockwork Assistant: Has +1/+1 for each spell you've cast this game.
		case CardIds.ClockworkAssistantTavernBrawl_PVPDR_Toki_T5:
			return and(side(inputSide), inDeck, spellExtended);
		case CardIds.ClockworkKnight:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.CloningDevice:
			return and(not(side(inputSide)), inDeck, minion);
		case CardIds.CloudSerpent_TLC_888:
			return and(
				side(inputSide),
				or(inHand, inDeck),
				or(elemental, dragon),
				not(cardIs(CardIds.CloudSerpent_TLC_888)),
			);
		case CardIds.ClutchOfCorruption_EDR_454:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.CoilCastingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), naga);
		// Coilskar Commander: Taunt. Battlecry: If you've cast three spells while holding this, summon two copies of this.
		case CardIds.CoilskarCommander:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ColdFeet:
			return and(not(side(inputSide)), or(inDeck, inHand), minion);
		case CardIds.ColiferoTheArtist_TOY_703:
			return and(side(inputSide), inDeck, minion);
		case CardIds.CollectorsIreTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, or(dragon, pirate, mech));
		// Colossus: Battlecry: Deal 1 damage to all enemies, twice. (Improved by Protoss spells you cast this game!)
		case CardIds.Colossus_SC_758:
			return and(side(inputSide), or(inHand, inDeck), protoss, spellExtended);
		// Commander Sivara: Battlecry: If you've cast three spells while holding this, add those spells back to your hand.
		case CardIds.CommanderSivara_TSC_087:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.ConchsCall:
			return and(side(inputSide), inDeck, or(naga, spell));
		case CardIds.Concierge_VAC_463:
			return and(side(inputSide), or(inDeck, inHand), fromAnotherClass);
		// Conductivity: The next spell you cast this turn also targets adjacent minions.
		case CardIds.Conductivity_YOG_522:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ConjuredBookkeeper_TLC_226:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.ConjurationSpecialist_CATA_979:
			return and(side(inputSide), inHand, spell);
		case CardIds.ConnivingConman_VAC_333:
			return (input: SelectorInput): SelectorOutput => {
				const currentClassInfo = input.deckState.hero?.classes?.[0];
				const cardsPlayedFromAnotherClass = input.deckState.cardsPlayedThisMatch.filter(
					(c) =>
						!!allCards.getCard(c.cardId).classes?.length &&
						!allCards.getCard(c.cardId).classes!.includes(CardClass[CardClass.NEUTRAL]) &&
						!allCards.getCard(c.cardId).classes!.includes(CardClass[currentClassInfo!]),
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
					and(side(inputSide), or(inDeck, inHand), fromAnotherClass),
				)(input);
			};
		case CardIds.ConservatorNymph:
			return and(side(inputSide), or(inDeck, inHand), treant);
		case CardIds.ConstructPylons_SC_755:
			return and(side(inputSide), or(inDeck, inHand), protoss);
		case CardIds.Consume_SC_020:
			return and(side(inputSide), or(inHand, inDeck), locationExtended);
		// Contaminated Lasher: Battlecry: If you've cast 5 or more spells this game, refresh 4 Mana Crystals.
		case CardIds.ContaminatedLasher_YOG_528:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ConfrontTheTolvir_CATA_560:
			return and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(1));
		case CardIds.ContrabandStash:
			return highlightConditions(
				tooltip(and(side(inputSide), cardsPlayedThisMatch, fromAnotherClassStrict)),
				and(side(inputSide), or(inDeck, inHand), fromAnotherClass),
			);
		case CardIds.CookiesLadleTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.Commencement:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ConcussiveShells_SC_411:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		// Cosmic Keyboard: After you cast a spell, summon an Elemental with stats equal to its Cost. Lose 1 Durability.
		case CardIds.CosmicKeyboard:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Cosmonaut_GDB_443:
			return and(side(inputSide), inDeck, spell);
		case CardIds.CostumedSinger:
			return and(side(inputSide), inDeck, secret);
		case CardIds.CorruptedFelstoneTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), fel);
		case CardIds.CorruptTheWaters:
		case CardIds.CorruptTheWaters_HeartOfVirnaal:
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
		case CardIds.CracklingCloudstrider_CATA_563:
			return and(side(inputSide), or(inHand, inDeck), spell, effectiveCostLess(5));
		case CardIds.CraneGame_TOY_884:
			return and(side(inputSide), inDeck, demon);
		case CardIds.CrashOfThunder:
			return and(side(inputSide), or(inHand, inDeck), nature);
		case CardIds.CrazedConductor:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.BaritoneImp, CardIds.Crescendo));
		case CardIds.Crescendo:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.BaritoneImp, CardIds.CrazedConductor));
		case CardIds.CreationProtocol:
		case CardIds.CreationProtocol_CreationProtocolToken:
			return and(side(inputSide), inDeck, minion);
		case CardIds.CreatureOfTheSacredCave_TLC_430:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inDeck), holy, cardsPlayedThisTurn),
				and(side(inputSide), or(inDeck, inDeck), holy),
			);
		case CardIds.CreepTumor_SC_011:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.CrimsonCommander_GDB_722:
			return and(side(inputSide), or(inHand, inDeck), draenei);
		case CardIds.CrystallineGreatmace_GDB_231:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		// Crystal Stag: Rush. Battlecry: If you've restored 5 Health this game, summon a copy of this.
		case CardIds.CrystalStag:
			return and(side(inputSide), or(inDeck, inHand), restoreHealth);
		case CardIds.CrystalWelder_GDB_130:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.CrowdRoaster:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		// Crushclaw Enforcer: Battlecry: If you've cast a spell while holding this, draw a Naga.
		case CardIds.CrushclawEnforcer:
			return highlightConditions(
				and(side(inputSide), inDeck, naga),
				and(side(inputSide), or(inHand, inDeck), spellExtended),
			);
		// Cryosleep (TLC_440): Deal 4 damage and draw a card. Kindred: Draw another.
		case CardIds.Cryosleep_TLC_440:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.CrystalsmithCultist:
			return and(side(inputSide), or(inDeck, inHand), shadow);
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
		case CardIds.Cultivation:
			return and(side(inputSide), or(inDeck, inHand), treant);
		case CardIds.CumuloMaximus:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.CupOMuscle_VAC_338:
		case CardIds.CupOMuscle_CupOMuscleToken_VAC_338t:
		case CardIds.CupOMuscle_CupOMuscleToken_VAC_338t2:
			return and(side(inputSide), or(inDeck, inHand), minion);
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
			return and(side(inputSide), inDeck, shadow);
		case CardIds.DarkInquisitorXanesh:
			return and(side(inputSide), or(inDeck, inHand), or(corrupt, corrupted));
		case CardIds.NzothTheCorruptor_DarkMachinations_THD_039p:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		// Darkmoon Magician: Elusive After you cast a spell, cast a random spell that costs (1) more.
		case CardIds.DarkmoonMagician_MIS_303:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Darkrider_EDR_456:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.DarkscaleBroodmother_CATA_111:
			return and(side(inputSide), or(inHand, inDeck), dragon);
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
		// Deathchiller: After you cast a spell, deal 1 damage to two random enemies.
		case CardIds.Deathchiller_CORE_RLK_083:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.DeathGrowl:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.Deathlord:
			return and(opposingSide(inputSide), inDeck, minion);
		case CardIds.DeathlyDeathTavernBrawl:
			return and(side(inputSide), minion, deathrattle);
		// Death Metal Knight: Taunt. Costs Health instead of Mana if your hero was healed this turn.
		case CardIds.DeathMetalKnight:
		case CardIds.DeathMetalKnight_CORE_ETC_523:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.DeathSpeakerBlackthorn_BAR_329:
			return and(side(inputSide), inDeck, minion, deathrattle, effectiveCostLess(6));
		case CardIds.DeathstriderTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		// Deathwing, Worldbreaker (CATA_190h): Battlecry: Choose 1 Cataclysms to unleash! Herald twice to upgrade.
		case CardIds.DeathwingWorldbreaker_CATA_190h:
			return and(side(inputSide), or(inDeck, inHand), herald);
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
		case CardIds.DetonationJuggernaut_CORE_WW_329:
		case CardIds.DetonationJuggernaut_WW_329:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		// Deviate Dreadfang: After you cast a Nature spell, summon a 4/2 Viper with Rush.
		case CardIds.DeviateDreadfang:
			return and(side(inputSide), or(inDeck, inHand), nature, spellExtended);
		case CardIds.DevilsaurMask_DINO_403:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.DevoutBlessingsTavernBrawlToken:
			return and(side(inputSide), inGraveyard, minion, deathrattle, minionsDeadSinceLastTurn);
		case CardIds.DevoutDungeoneer:
			return highlightConditions(and(side(inputSide), inDeck, holy, spell), and(side(inputSide), inDeck, spell));
		// Devout Pupil: Divine Shield, Taunt Costs (1) less for each spell you've cast on friendly characters this game.
		case CardIds.DevoutPupil:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, canTargetFriendlyCharacter);
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
				and(side(inputSide), inDeck, pirate),
				and(side(inputSide), inDeck, minion, minion),
			);
		case CardIds.DimensionalRipper:
			return and(side(inputSide), inDeck, minion);
		case CardIds.DimensionalWeaponsmith_END_021:
			return and(side(inputSide), or(inHand, inDeck), or(minion, weapon));
		case CardIds.DinnerPerformer:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, effectiveCostLessThanRemainingMana),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.Dinositter_TLC_822:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.Dinomancy_DinomancyToken:
			return and(side(inputSide), or(inDeck, inHand, inPlay), beast);
		case CardIds.DirgeOfDespair:
			return and(side(inputSide), inDeck, demon, minion);
		case CardIds.DiscipleOfDemise_TIME_EVENT_301:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.DiscipleOfEonar:
			return and(side(inputSide), or(inDeck, inHand), chooseOne);
		case CardIds.DiscipleOfGolganneth:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.DiscipleOfTheDove_TIME_037:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.DisciplinarianGandling:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.DiscoMaul:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.DisksOfLegendTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, legendary);
		case CardIds.DispossessedSoul:
		case CardIds.DispossessedSoul_CORE_REV_901:
			return and(side(inputSide), or(inDeck, inHand), location);
		case CardIds.Divergence_TIME_030:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.DiveTheGolakkaDepths_TLC_426:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		case CardIds.DivineAugur_TIME_429:
			return and(side(inputSide), or(inHand, inDeck), minion);
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
		// Double Time: Passive After you cast your first spell in a turn, cast a copy of it (targets chosen randomly).
		case CardIds.DoubleTime:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Dozing Kelpkeeper: Rush. Starts Dormant. After you've cast 5 Mana worth of spells, awaken.
		case CardIds.DozingKelpkeeper:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		case CardIds.Dragonhatcher:
			return and(side(inputSide), inDeck, dragon);
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
		case CardIds.DredgerStaff:
		case CardIds.DredgerStaff_CORE_REV_338:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Drekthar_AV_100:
			return !card
				? null
				: and(side(inputSide), inDeck, minion, effectiveCostLess(card.getEffectiveManaCost() ?? 0));
		case CardIds.DrocomurchanicasTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, or(dragon, murloc, mech));
		case CardIds.DryscaleDeputy_WW_383:
			return and(side(inputSide), inDeck, spell);
		case CardIds.DunBaldarBunker:
			return and(side(inputSide), inDeck, secret);
		case CardIds.DynOMatic:
		case CardIds.DynOMaticCore:
			return and(side(inputSide), or(inHand, inDeck), mech);
		case CardIds.EaglehornBowLegacy:
		case CardIds.EaglehornBowVanilla:
			return and(side(inputSide), or(inDeck, inHand), secret);
		case CardIds.EarthenRoar_CATA_554:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.EbbAndFlow_TIME_702:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.StonetalonStriker_CATA_551:
		case CardIds.EbonscaleScout_CATA_552:
		case CardIds.Ebyssian_CATA_553:
		case CardIds.Ebyssian_EbyssianToken_CATA_553t:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.EchoOfMedivh:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.EdgeOfDredgeTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), dredge);
		// Eerie Stone: Passive After you destroy an enemy minion with a Shadow spell, add a copy of that minion to your hand. It costs (2) less.
		case CardIds.EerieStoneTavernBrawl:
			return and(side(inputSide), spellExtended, shadow);
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
		case CardIds.EmeraldHiveQueen:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.EmberrootDestroyer_FIR_955:
			return and(side(inputSide), or(inHand, inDeck), selfDamageHero);
		case CardIds.EmberrootDestroyer_FIR_955:
			return and(side(inputSide), or(inHand, inDeck), selfDamageHero);
		case CardIds.EmberscaleDrake:
			return and(side(inputSide), or(inDeck, inHand), dragon);
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
		case CardIds.EruptingVolcano_CATA_584:
			return and(side(inputSide), or(inHand, inDeck), spell, fire);
		case CardIds.EternalLayover_WORK_028:
			return and(side(inputSide), or(inDeck, inHand), generateCorpse);
		case CardIds.EternalServitude_CORE_ICC_213:
		case CardIds.EternalServitude_ICC_213:
			return and(side(inputSide), inGraveyard, minion);
		// Ethereal Oracle: Spell Damage +1 Spellburst: Draw 2 spells.
		case CardIds.EtherealOracle_GDB_310:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended, damage),
				and(side(inputSide), inDeck, spell),
			);
		case CardIds.EtherealPeddler:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
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
			return and(side(inputSide), inDeck, spell, effectiveCostMore(4));
		case CardIds.FairyTaleForest_TOY_507:
			return and(side(inputSide), inDeck, minion, battlecry);
		case CardIds.Falric_CORE_EDR_003:
			return and(side(inputSide), inDeck, spendCorpse);
		case CardIds.FaithfulCompanions:
			return and(side(inputSide), inDeck, beast);
		case CardIds.FancyPackaging_TOY_881:
			return and(side(inputSide), or(inHand, inDeck), minion, divineShield);
		case CardIds.FandralStaghelm_CORE_OG_044:
		case CardIds.FandralStaghelm_OG_044:
			return and(side(inputSide), or(inDeck, inHand, inOther), chooseOne);
		case CardIds.FangboundDruid:
			return and(side(inputSide), or(inHand, inDeck), beast);
		// Farseer Nobundo: Deathrattle: Open the Galaxy's Lens. It absorbs the power of the next spell you cast.
		case CardIds.FarseerNobundo_GDB_447:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		// Farseer Wo: Elusive After you cast a spell, Discover a Nature spell from the past.
		case CardIds.FarseerWo_TIME_013:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.Fatebreaker_TIME_028:
			return highlightConditions(
				and(
					side(inputSide),
					inDeck,
					cardIs(CardIds.TwilightTimehopper_ShredOfTimeToken_TIME_025t as unknown as CardIds),
				),
				and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.TachyonBarrage_TIME_027,
						CardIds.TwilightTimehopper_TIME_025,
						CardIds.EntropicContinuity_TIME_026,
					),
				),
			);
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
		// Felfire Blaze: After you cast a Fel spell, destroy this and deal 2 damage to all enemies.
		case CardIds.FelfireBlaze_FIR_904:
			return and(side(inputSide), or(inHand, inDeck), fel, spellExtended);
		case CardIds.FelfireBonfire_VAC_952:
			return and(side(inputSide), or(inHand, inDeck), minion, deathrattle);
		case CardIds.FelfireInTheHole:
			return highlightConditions(and(side(inputSide), inDeck, spell, fel), and(side(inputSide), inDeck, spell));
		case CardIds.FerociousFelbat_EDR_892:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle, effectiveCostMore(4)),
				and(side(inputSide), inGraveyard, minion, deathrattle, effectiveCostMore(4)),
			);
		case CardIds.KaelthasSunstrider_FelFueled_THD_043p:
			return and(side(inputSide), or(inDeck, inHand), notInInitialDeck);
		case CardIds.Felgorger_SW_043:
			return and(side(inputSide), inDeck, spell, felStrict);
		case CardIds.IllidanStormrage_FelInside_THD_004p:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.IxlidFungalLord:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Felosophy:
			return and(side(inputSide), or(inHand, inDeck), demon);
		// Felscale Evoker: Battlecry: If you've cast three spells while holding this, summon a different Demon from your deck.
		case CardIds.FelscaleEvoker:
			return highlightConditions(
				and(side(inputSide), inDeck, demon, not(cardIs(CardIds.FelscaleEvoker))),
				and(side(inputSide), or(inDeck, inHand), spellExtended),
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
		case CardIds.Finality_END_003:
			return and(side(inputSide), inDeck, undead);
		case CardIds.FinjaTheFlyingStar:
		case CardIds.FinjaTheFlyingStar_CORE_CFM_344:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.FireBreath_DINO_406:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.Firegill_DINO_404:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, or(elemental, murloc)),
				and(side(inputSide), or(inHand, inDeck), minion),
			);
		// Firekeeper's Idol: Passive After you cast a Fire spell, summon a 1/2 Flame Elemental and add one to your hand.
		case CardIds.FirekeepersIdolTavernBrawl:
			return and(side(inputSide), spellExtended, fire);
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
		// Flames of the Kirin Tor: Passive After you cast your first Fire spell in a turn, add a random non-Legendary Fire spell from your class to your hand.
		case CardIds.FlamesOfTheKirinTorTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fire);
		case CardIds.Flamewaker:
		// Flamewaker: After you cast a spell, deal 2 damage randomly split among all enemies.
		case CardIds.Flamewaker_TUTR_BRM_002:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Flame Waves: Passive At the end of your turn, deal 2 damage to all enemy minions for each Fire spell you've cast this turn.
		case CardIds.FlameWavesTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fire);
		case CardIds.FlashSale_TOY_716:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.FleshBehemoth_RLK_830:
		case CardIds.FleshBehemoth_RLK_Prologue_RLK_830:
			return and(side(inputSide), inDeck, undead, not(cardIs(CardIds.FleshBehemoth_RLK_830)));
		case CardIds.FlickeringLightbot_MIS_918:
		// Flickering Lightbot: Gigantic Costs (1) less for each Holy spell you've cast this game.
		case CardIds.FlickeringLightbot_FlickeringLightbotToken_MIS_918t:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, holy);
		case CardIds.FlightOfTheFirehawk_TLC_222:
			return and(side(inputSide), inDeck, minion, not(tribeless));
		case CardIds.Flowrider:
			return highlightConditions(
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), or(inDeck, inHand), overload),
			);
		case CardIds.FlusteredLibrarian:
		case CardIds.FlusteredLibrarian_CORE_REV_242:
			return and(side(inputSide), or(inHand, inDeck), imp);
		case CardIds.FluxRevenant_TIME_214:
			return and(side(inputSide), or(inDeck, inHand), spell, nature, dealsDamage);
		case CardIds.FlyOffTheShelves_TOY_714:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.Foamrender_MIS_101:
			return and(side(inputSide), or(inDeck, inHand), spendCorpse);
		case CardIds.FogsailFreebooterCore:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.FoodFight_VAC_533:
		case CardIds.FoodFight_EntréeToken_VAC_533t:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ForlornStalker:
			return and(side(inputSide), or(inHand, inDeck), minion, deathrattle);
		case CardIds.ForebodingFlame_GDB_121:
			return and(side(inputSide), or(inDeck, inHand), demon, notInInitialDeck);
		case CardIds.ForestsGift_CATA_138:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.ForsakenLieutenant_AV_601:
			return and(side(inputSide), or(inDeck, inHand), deathrattle, minion);
		case CardIds.ForgedInFlame:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.ForgeOfSouls_CORE_ICC_281:
		case CardIds.ForgeOfSouls_ICC_281:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.FossilFanatic:
			return and(side(inputSide), inDeck, spell, felStrict);
		case CardIds.FoxyFraud:
		case CardIds.FoxyFraud_CORE_DMF_511:
			return and(side(inputSide), or(inHand, inDeck), combo);
		// Fragment of Nothing: After you cast a spell on a minion, draw a card.
		case CardIds.FragmentOfNothing_END_026:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.FreeAdmission:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), demon),
				and(side(inputSide), or(inDeck, inHand), minion),
			);
		case CardIds.FrequencyOscillator:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.PeacefulPiper_FriendlyFace:
			return and(side(inputSide), inDeck, beast);
		case CardIds.Pelagos_CORE_REV_250:
		case CardIds.Pelagos_REV_250:
		// Pelagos: After you cast a spell on a minion, set its stats to the highest stat.
		case CardIds.Pelagos_REV_781:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, canTargetFriendlyCharacter);
		case CardIds.PerennialSerpent_TIME_022:
			return and(side(inputSide), or(inHand, inDeck), dormant);
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
			return and(side(inputSide), or(inDeck, inHand), mech);
		// The Galactic Projection Orb: Recast a random spell of each Cost you've cast this game (targets enemies if possible).
		case CardIds.TheGalacticProjectionOrb_TOY_378:
			return highlightConditions(
				and(side(inputSide), spellPlayedThisMatch),
				and(side(inputSide), or(inHand, inDeck), spellExtended),
			);
		case CardIds.GameMasterNemsy_TOY_524:
			return and(side(inputSide), inDeck, demon);
		case CardIds.GatherYourParty:
			return and(side(inputSide), inDeck, minion);
		// Gazlowe: Whenever you cast a 1-Cost spell, add a random Mech to your hand.
		case CardIds.Gazlowe:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, effectiveCostEqual(1));
		case CardIds.GelbinOfTomorrow_TIME_009:
			return and(side(inputSide), inDeck, aura);
		case CardIds.GennCursedKing_CATA_615:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), effectiveCostEven),
				and(side(inputSide), or(inHand, inDeck), effectiveCostOdd),
			);
		case CardIds.GhastlyGravedigger:
			return and(side(inputSide), or(inDeck, inHand), secret);
		case CardIds.Ghost_SC_408:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.GhoulishAlchemist:
			return and(side(inputSide), or(inDeck, inHand), isConcoctionRelated);
		case CardIds.GiantAnaconda:
			return and(side(inputSide), or(inDeck, inHand), minion, attackGreaterThan(4));
		case CardIds.Gigantotem:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.GiftwrappedWhelp_TOY_386:
			return and(
				side(inputSide),
				or(inDeck, inHand),
				dragon,
				not(entityIs({ entityId: card?.entityId, cardId: card?.cardId })),
			);
		// Gladesong Siren: Lifesteal Costs (1) if you've played a Holy and Shadow spell this turn.
		case CardIds.GladesongSiren_TLC_819:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), holy, spellExtended),
				and(side(inputSide), or(inDeck, inHand), shadow, spellExtended),
			);
		case CardIds.GladiatorialCombat_TIME_870:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Glaivetar:
			return and(side(inputSide), or(inHand, inDeck), outcast);
		case CardIds.GlowflySwarm:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.GluthSicleTavernBrawl:
			return and(side(inputSide), inDeck, undead);
		case CardIds.GluthTavernBrawl_PVPDR_Sai_T1:
			return and(side(inputSide), or(inDeck, inHand), undead);
		// Glacial Advance: Deal $4 damage. Your next spell this turn costs (2) less.
		case CardIds.GlacialAdvance_RLK_512:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Glacial Downpour: Passive At the end of your turn, summon a 2/3 Water Elemental if you've cast a Frost spell this turn.
		case CardIds.GlacialDownpourTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, frost);
		case CardIds.GlacialMysteries_ICC_086:
		case CardIds.GlacialMysteries_CORE_ICC_086:
			return and(side(inputSide), inDeck, secret);
		case CardIds.GoblinBlastmage:
		case CardIds.GoblinBlastmage_WON_035:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.GoboglideTech:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.Goldrinn_EDR_480:
			return and(side(inputSide), or(inDeck, inHand), beast);
		// Golganneth, the Thunderer: Titan Your first spell each turn costs (3) less.
		case CardIds.GolgannethTheThunderer:
			return highlightConditions(
				and(side(inputSide), inDeck, overload),
				and(side(inputSide), or(inDeck, inHand), spellExtended),
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
		case CardIds.GoruTheMightree:
			return and(side(inputSide), or(inDeck, inHand), treant);
		case CardIds.GraniteForgeborn:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.GrandArchivist:
			return tooltip(and(side(inputSide), inDeck, spell));
		case CardIds.GrandMagisterRommath:
			return tooltip(and(side(inputSide), cardsPlayedThisMatch, spell, notInInitialDeck));
		// Grand Magus Antonidas: Battlecry: If you've cast a Fire spell on each of your last three turns, cast 3 Fireballs at random enemies. (0/3)
		case CardIds.GrandMagusAntonidas:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, fire);
		case CardIds.GraveDefiler:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
		case CardIds.GraveDigging:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.GreedyPartner_WW_901:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(2));
		case CardIds.GreedyGainsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.GreenThumbGardener:
			return and(side(inputSide), or(inDeck, inHand), spell);
		// Gadgetzan Auctioneer: Whenever you cast a spell, draw a card.
		case CardIds.GadgetzanAuctioneerCore:
		case CardIds.GadgetzanAuctioneerLegacy:
		case CardIds.GadgetzanAuctioneerTavernBrawl:
		case CardIds.GadgetzanAuctioneerVanilla:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Grey Sage Parrot: Battlecry: Repeat the last spell you've cast that costs (6) or more.
		case CardIds.GreySageParrot:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, effectiveCostMore(5));
		case CardIds.Grillmaster_VAC_917:
			return (input: SelectorInput): SelectorOutput => {
				if (!input.deckState.deck?.length) {
					return false;
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
		// Grove Shaper: After you cast a Nature spell, summon a 2/2 Treant with "Deathrattle: Get a copy of that spell."
		case CardIds.GroveShaper_EDR_271:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
		case CardIds.GuardianAnimals:
			return and(side(inputSide), inDeck, beast, effectiveCostLess(6));
		// Guardian Light: Passive After you cast a Holy spell, summon an Ancient Guardian with stats equal to its Cost.
		case CardIds.GuardianLightTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, holy);
		case CardIds.GuessTheWeight_Less:
			return (input: SelectorInput): boolean => {
				if (!input.deckState.hand.length) {
					return false;
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
					return false;
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
		// Guiding Figure: Spellburst: Trigger a random friendly minion's Deathrattle. Starship Piece
		case CardIds.GuidingFigure_GDB_106:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), or(inHand, inDeck), spellExtended),
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
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), inGraveyard, minion),
			);
		case CardIds.HagathasEmbrace:
		case CardIds.HagathasEmbraceTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.HagathaTheFabled_TOY_504:
			return and(side(inputSide), inDeck, spell, effectiveCostMore(4));
		case CardIds.HallazealTheAscended:
		// Hallazeal the Ascended: Spell Damage +1 Your spells have Lifesteal.
		case CardIds.HallazealTheAscended_WON_336:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		case CardIds.HammTheHungry_VAC_340:
			return and(opposingSide(inputSide), inDeck, minion);
		case CardIds.HamuulRunetotem_EDR_845:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, not(nature)),
				and(side(inputSide), inDeck, spell, nature),
			);
		// Handmaiden: Battlecry: If you've cast three spells while holding this, draw 3 cards.
		case CardIds.Handmaiden:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		case CardIds.TheHarvesterOfEnvy:
		case CardIds.TheHarvesterOfEnvy_CORE_REV_011:
			return and(side(inputSide), or(inDeck, inHand), copiedFromOpponent);
		case CardIds.HatcheryHelper_TLC_233:
			return and(side(inputSide), or(inDeck, inHand, inPlay), minion, attackLessThan(3));
		case CardIds.HatchingCeremony_DINO_405:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.HawkstriderRancher:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.HaywireHornswog_END_030:
			return and(side(inputSide), or(inDeck, inHand), overload);
		case CardIds.HealingWave:
		case CardIds.HealingWave_WON_320:
			return and(side(inputSide), inDeck, minion);
		case CardIds.HedgeMaze_REV_333:
		case CardIds.HedgeMaze_REV_792:
			return and(side(inputSide), inDeck, minion, deathrattle);
		// Hedra the Heretic: Battlecry: For each spell you've cast while holding this, summon a minion of that spell's Cost.
		case CardIds.HedraTheHeretic_TSC_658:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.HeirOfHereafter_TIME_871:
			return and(side(inputSide), or(inHand, inDeck), minion);
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
		// Herald of Chaos: Lifesteal Battlecry: If you've cast a Fel spell while holding this, gain Rush.
		case CardIds.HeraldOfChaos:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, fel);
		case CardIds.HeraldOfFlame_TRLA_176:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		// Herald of Light: Battlecry: If you've cast a Holy spell while holding this, restore #6 Health to all friendly characters.
		case CardIds.HeraldOfLight:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, holy);
		case CardIds.HeraldOfLokholar:
			return and(side(inputSide), inDeck, spell, frost);
		// Herald of Nature: Battlecry: If you've cast a Nature spell while holding this, give your other minions +1/+1.
		case CardIds.HeraldOfNature:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
		// Herald of Shadows: Battlecry: If you've cast a Shadow spell while holding this, steal 2 Health from a minion.
		case CardIds.HeraldOfShadows:
			return and(side(inputSide), inDeck, spellExtended, shadow);
		case CardIds.HerbivoreAssistant_DINO_419:
			return and(side(inputSide), or(inHand, inDeck), beast);
		// High Abbess Alura: Spellburst: Cast a spell from your deck (targets this if possible).
		case CardIds.HighAbbessAlura:
			return and(side(inputSide), inDeck, spellExtended);
		case CardIds.HighCultistBasaleph:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), undead),
				and(side(inputSide), minionsDeadSinceLastTurn, undead),
			);
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
		// Holy Cowboy: Battlecry: Your next Holy spell costs (2) less.
		case CardIds.HolyCowboy_WW_335:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, holy);
		case CardIds.HolyEggbearer_DINO_411:
			return and(side(inputSide), or(inHand, inDeck), attackIs(0), minion);
		// Holy Glowsticks: Lifesteal Deal $4 damage to a minion. Costs (1) if you've cast a Holy spell this turn.
		case CardIds.HolyGlowsticks_MIS_709:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, holy);
		case CardIds.Hookfist3000:
		case CardIds.Hookfist3000_CORE_NX2_028:
			return and(side(inputSide), or(inDeck, inHand), givesHeroAttack);
		case CardIds.HopeOfQuelthalas:
			return and(side(inputSide), or(inDeck, inHand, inPlay), minion);
		case CardIds.HornOfWrathion:
			return and(side(inputSide), inDeck, dragon);
		case CardIds.HotSpringGlider_TLC_428:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		// Hot Streak: Your next Fire spell this turn costs (2) less.
		case CardIds.HotStreak:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fire);
		case CardIds.HoundsOfFury_TIME_443:
			return and(side(inputSide), inDeck, minion);
		case CardIds.HourglassAttendant_TIME_100:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.HozenRoughhouser_VAC_938:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.Hullbreaker:
			return and(side(inputSide), inDeck, spell);
		case CardIds.HungeringAncient_EDR_494:
			return and(side(inputSide), inDeck, minion);
		case CardIds.HuskEternalReaper_TIME_618:
			return and(side(inputSide), or(inHand, inDeck), generateCorpse);
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
							-(getProcessedCard(c.cardId, c.entityId, input.deckState, allCards).cost ?? 0),
						]),
					);
				let finalCandidates: ShortCard[] = [];
				if (!!candidates?.length) {
					// First remove duplicate cardIds
					const withoutDuplicates = candidates.filter(
						(c, index) => candidates.findIndex((c2) => c2.cardId === c.cardId) === index,
					);
					const targets = withoutDuplicates.slice(0, 3);
					const lowestCostTarget = targets[targets.length - 1];
					const lowestCostDeckCard = input.deckState.findCard(lowestCostTarget.entityId)?.card;
					if (!lowestCostDeckCard) {
						return false;
					}
					const lowestCost = getCost(lowestCostDeckCard, input.deckState, allCards);
					finalCandidates = candidates.filter(
						(c) =>
							(getProcessedCard(c.cardId, c.entityId, input.deckState, allCards).cost ?? 0) >=
							(lowestCost ?? 0),
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
		// Ice Revenant: Whenever you cast a Frost spell, gain +2/+2.
		case CardIds.IceRevenant:
			return and(side(inputSide), inDeck, spellExtended, frost);
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
		case CardIds.IdolOfYshaarj:
			return and(side(inputSide), inDeck, minion);
		// Idols of Elune: Passive At the end of your turn, cast a spell you've cast this turn (targets are random).
		case CardIds.IdolsOfEluneTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.IngeniousArtificer_GDB_135:
			return and(side(inputSide), or(inHand, inDeck), draenei);
		case CardIds.IgnisTheEternalFlame:
			return and(side(inputSide), or(inDeck, inHand), forge);
		// Imp-credible Trousers: Passive After you cast your first Fel spell in a turn, shuffle 2 Fel Rifts into your deck. Draw a card.
		case CardIds.ImpCredibleTrousersTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fel);
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
		// Inferno Herald: After you cast a Fire spell, get a random Elemental and reduce its Cost by (3).
		case CardIds.InfernoHerald_FIR_913:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, fire);
		case CardIds.InfernalStratagem_GDB_122:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.Infestor_SC_002:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		// Inkmaster Solia: Battlecry: If your deck has no duplicates, the next spell you cast this turn costs (0).
		case CardIds.InkmasterSolia:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended),
				and(side(inputSide), inDeck, hasMultipleCopies),
			);
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
		case CardIds.InspiringMaul_CATA_472:
			return and(side(inputSide), or(inHand, inDeck), minion, endOfTurn);
		case CardIds.InspiringPresenceTavernBrawl:
			return and(side(inputSide), minion, legendary);
		case CardIds.InstrumentSmasher:
			return and(side(inputSide), inDeck, weapon);
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
			return and(side(inputSide), or(inDeck, inHand), mech, effectiveCostMore(4));
		case CardIds.InventorsAura:
			return and(side(inputSide), or(inDeck, inHand), mech);
		// Invent-O-Matic: Whenever you Magnetize a minion, give it +1/+1.
		case CardIds.InventOMatic:
			return and(side(inputSide), or(inDeck, inHand), magnetic);
		case CardIds.InvestmentOpportunity:
			return and(side(inputSide), inDeck, overload);
		// Invigorating Light: Passive Whenever you play a Holy spell, give all friendly characters +1 Health.
		case CardIds.InvigoratingLightTavernBrawl:
			return and(side(inputSide), spellExtended, holy);
		case CardIds.InvigoratingSermon:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Invincible:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.Inzah:
			return and(side(inputSide), or(inDeck, inHand), overload);
		// Iron Roots: Passive After you cast a Nature spell, give a random friendly minion +1/+1 and Taunt.
		case CardIds.IridescentFlitterwing_CATA_133:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.IronRootsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
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
			return highlightConditions(and(side(inputSide), or(inHand, inDeck), starshipExtended));
		case CardIds.Jitterbug:
			return and(side(inputSide), or(inHand, inDeck), divineShield);
		case CardIds.JobShadower_WORK_032:
			return and(side(inputSide), or(inHand, inDeck), selfDamageHero);
		case CardIds.JotunTheEternal:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.JoymancerJepetto_TOY_960:
			return highlightConditions(
				tooltip(and(side(inputSide), minionPlayedThisMatch, or(attackIs(1), healthIs(1)))),
				and(side(inputSide), or(inDeck, inHand), minion, or(attackIs(1), healthIs(1))),
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
		case CardIds.JungleGiants_BarnabusTheStomperToken:
			return and(side(inputSide), inDeck, minion);
		// Jungle Jammer: Deathrattle: Summon a random 1-Cost Beast. (Cast spells while equipped to improve!)
		case CardIds.JungleJammer:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		// K'ara, the Dark Star: Spellburst: Steal 2 Health from a random enemy. (Shadow spells don't remove this Spellburst.)
		case CardIds.KaraTheDarkStar_GDB_127:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, shadow);
		case CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2:
			return and(
				side(inputSide),
				or(inDeck, inHand, inPlay),
				cardIs(CardIds.MedivhTheHallowed_AtieshTheGreatstaffToken_TIME_890t),
			);
		case CardIds.KathrenaWinterwisp:
			return and(side(inputSide), inDeck, beast);
		case CardIds.Kazakusan_ONY_005:
			return and(side(inputSide), or(inDeck, inHand, cardsPlayedThisMatch), dragon);
		case CardIds.Khazgoroth:
		case CardIds.Khazgoroth_TitanforgeToken:
			return and(side(inputSide), inDeck, weapon);
		// Khadgar's Scrying Orb: Passive Your spells cost (1) less.
		case CardIds.KhadgarsScryingOrb:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Sorcerer's Apprentice: Your spells cost (1) less.
		case CardIds.SorcerersApprenticeLegacy:
		case CardIds.SorcerersApprenticeVanilla:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.KeeneyeSpotter:
			return and(side(inputSide), or(inDeck, inHand), givesHeroAttack);
		case CardIds.KeeperOfFlame_FIR_928:
			return and(side(inputSide), or(inDeck, inHand), minion);
		// Keeper Stalladris - After you cast a Choose One spell, add copies of both choices to your hand.
		case CardIds.KeeperStalladris:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, chooseOne);
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
		case CardIds.KingPhaoris:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.KingpinPud_WW_421:
			return and(
				side(inputSide),
				or(inDeck, inHand, inGraveyard),
				cardIs(CardIds.OgreGangOutlaw_WW_418, CardIds.OgreGangRider_WW_419, CardIds.OgreGangAce_WW_420),
			);
		// King's Decree: After you cast a spell, reduce the Cost of a Beast in your hand by the spell's Cost.
		case CardIds.KingKrush_KingsDecree_THD_012p:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), spellExtended),
				and(side(inputSide), or(inDeck, inHand), beast),
			);
		case CardIds.KingsDefender:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		// King Tide: Battlecry: Both players' spells cost (5) until the end of your next turn.
		case CardIds.KingTide_VAC_524:
			return and(or(inDeck, inHand), spellExtended);
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
					return false;
				}

				const highestCost = Math.max(
					...input.deckState.minionsDeadThisMatch.map((c) => allCards.getCard(c.cardId).cost ?? 0),
				);
				const candidates = input.deckState.minionsDeadThisMatch.filter(
					(c) => allCards.getCard(c.cardId).cost === highestCost,
				);
				if (!candidates.length) {
					return false;
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
		// Kolkar Pack Runner: After you cast a spell, summon a 1/1 Hyena with Rush.
		case CardIds.KolkarPackRunner:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		// K'ure, the Light Beyond: Spellburst: Summon a random 3-Cost minion. (Holy spells don't remove this Spellburst.)
		case CardIds.KureTheLightBeyond_GDB_442:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, holy);

		// Lab Constructor: At the end of your turn, summon a copy of this. Forge: Gain Magnetic (highlight mechs).
		case CardIds.LabConstructor:
		case CardIds.LabConstructor_LabConstructorToken:
			return and(side(inputSide), or(inHand, inDeck), mech);
		case CardIds.LabPatron_TOY_651:
			return and(side(inputSide), or(inHand, inDeck), givesArmor);
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
		// Lady Naz'jar: While in your hand, this transforms after you cast a Fire, Frost, or Arcane spell.
		case CardIds.LadyNazjar_TID_709:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended, fire),
				and(side(inputSide), or(inHand, inDeck), spellExtended, frost),
				and(side(inputSide), or(inHand, inDeck), spellExtended, arcane),
			);
		// Lady S'theno: Immune while attacking. After you cast a spell, attack the lowest Health enemy.
		case CardIds.LadyStheno_TSC_218:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.LadyVashj_VashjPrimeToken:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Lamplighter_VAC_442:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.LaserBarrage_GDB_845:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.LastingLegacy_TIME_449:
			return and(side(inputSide), inDeck, minion);
		case CardIds.LastStand:
			return and(side(inputSide), inDeck, taunt);
		case CardIds.LeadDancer:
			// TODO: implement current attack
			return and(inDeck, minion, attackLessThan(4));
		// Learn Draconic: Sidequest: Spend 8 Mana on spells. Reward: Summon a 6/6 Dragon.
		case CardIds.LearnDraconic:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		// Lifeguard: Taunt Battlecry: The next spell you cast has Lifesteal.
		case CardIds.Lifeguard_VAC_919:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, dealsDamage);
		// Liferender: Battlecry: If your hero's Health changed this turn, deal 6 damage to an enemy minion.
		case CardIds.Liferender_TIME_614:
			return and(side(inputSide), or(inHand, inDeck), or(restoreHealth, givesHeroAttack, costHealth));
		case CardIds.LiftOff_SC_410:
			return and(side(inputSide), or(inHand, inDeck), terran);
		// Light of the New Moon: Give a minion +3/+3. (Cast 3 spells to return this to your hand when played.)
		case CardIds.LightOfTheNewMoon_FIR_918:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion),
				and(side(inputSide), or(inHand, inDeck), spellExtended),
			);
		case CardIds.LightmawNetherdrake:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), holy, spell),
				and(side(inputSide), or(inHand, inDeck), shadow, spell),
			);
		// Lightforged Crusader: "Battlecry: If your deck has no Neutral cards, add 5 random Paladin cards to your hand."
		case CardIds.LightforgedCrusader:
		// Lightforged Zealot: "Battlecry: If your deck has no Neutral cards, equip a 4/2 Truesilver Champion."
		case CardIds.LightforgedZealot:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.Lightray:
			return and(side(inputSide), or(inHand, inDeck), paladin);
		case CardIds.Lightspeed_GDB_457:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.LilypadLurker:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		// Li'Na, Shop Manager: Whenever you cast a spell, fill your board with random minions of that Cost.
		case CardIds.LinaShopManager_TOY_531:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		// Lock and Load: Each time you cast a spell this turn, get a random Hunter card.
		case CardIds.LockAndLoad_WON_023:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.LockOn_SC_407:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		case CardIds.PatchesThePirate_LockedAndLoaded_THD_025p:
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.LohTheLivingLegend_TLC_257:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.LogoshsLastStand_CATA_610:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.LokenJailerOfYoggSaron:
			return and(side(inputSide), inDeck, minion);
		case CardIds.LongneckEgg_DINO_130:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.LorewalkerChoLegacy:
		case CardIds.LorewalkerChoVanilla:
		// Lorewalker Cho: Whenever a player casts a spell, put a copy into the other player’s hand.
		case CardIds.LorewalkerCho_CORE_EX1_100:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.LorthemarTheron_RLK_593:
			return and(side(inputSide), inDeck, minion);
		// Love Everlasting: Your first spell each turn costs (2) less. Lasts until you don't play a spell on your turn.
		case CardIds.LoveEverlasting:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		// Magister Unchained: Until the end of your turn, after you cast a spell, draw a spell. Allied: Mage.
		case CardIds.MagisterUnchainedTavernBrawlToken:
			return and(side(inputSide), inDeck, spell);
		// Magister's Apprentice: Your Arcane spells cost (1) less.
		case CardIds.MagistersApprentice:
			return and(side(inputSide), inDeck, spellExtended, arcane);
		// Malevolent Mutant: Battlecry: Choose a Fel spell in your hand. Get a copy of it.
		case CardIds.MalevolentMutant_CATA_697:
			return and(side(inputSide), or(inDeck, inHand), spell, fel);
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
		case CardIds.MalygosTheSpellweaver_LEG_CS3_034:
			return and(side(inputSide), inDeck, spell);
		// Mana Cyclone: Battlecry: For each spell you've cast this turn, add a random Mage spell to your hand.
		case CardIds.ManaCyclone:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ManaGiant:
			return and(side(inputSide), or(inDeck, inHand, inOther), notInInitialDeck);
		case CardIds.ManAtArms:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.ManifestedTimeways_TIME_019:
			return and(side(inputSide), or(inDeck, inHand), aura);
		// Mantle Shaper: Costs (1) less for each spell you've cast while holding this.
		case CardIds.MantleShaper_DEEP_004:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ManufacturingError_TOY_371:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MarkOfScorn:
			return and(side(inputSide), inDeck, not(minion));
		case CardIds.MarkOfTheSpikeshell:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), taunt, minion),
				and(side(inputSide), or(inHand, inDeck), minion),
			);
		// Marooned Archmage: Your first spell each turn costs (2) less.
		case CardIds.MaroonedArchmage_VAC_435:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Marshland Thresher: After you cast a spell, gain Divine Shield.
		case CardIds.MarshlandThresher_TLC_256:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Marshspawn_BT_115:
		// Marshspawn: Battlecry: If you cast a spell last turn, Discover a spell.
		case CardIds.Marshspawn_CORE_BT_115:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.MaskedReveler:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, deathrattle),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.MassResurrection_DAL_724:
			return tooltip(and(side(inputSide), inGraveyard, minion));
		case CardIds.MastersCall:
		case CardIds.MastersCall_CORE_TRL_339:
			return highlightConditions(and(side(inputSide), inDeck, beast), and(side(inputSide), inDeck, minion));
		case CardIds.MasterJouster:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MaximaBlastenheimer:
			return and(side(inputSide), inDeck, minion);
		case CardIds.MeatGrinder_RLK_120:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Merithra_EDR_238:
			return and(side(inputSide), or(inDeck, inHand), minion, costMore(7));
		// Mechanized Magma: Whenever you play a Fire spell, gain stats equal to its Cost.
		case CardIds.MechanizedMagma_TLC_224:
			return and(side(inputSide), or(inDeck, inHand), fire, spellExtended);
		case CardIds.MechaShark_TSC_054:
			return and(side(inputSide), or(inDeck, inHand), mech);
		// Meddlesome Servant: Battlecry: If you've cast 5 or more spells this game, draw 2 cards.
		case CardIds.MeddlesomeServant_YOG_518:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.MedivhsTriumph_CATA_308:
			return and(side(inputSide), or(inDeck, inHand, inPlay), legendary, not(cardType(CardType.HERO)));
		case CardIds.MedivhTheHallowed_TIME_890:
			return and(
				side(inputSide),
				or(inDeck, inHand, inPlay),
				cardIs(CardIds.MedivhTheHallowed_KarazhanTheSanctumToken_TIME_890t2),
			);
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
		// Mending Pools: Passive After you cast your first Nature spell in a turn, restore 2 Health to all friendly characters.
		case CardIds.MendingPoolsTavernBrawl:
			return and(side(inputSide), spellExtended, nature);
		case CardIds.MemoriamManifest_TIME_616:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), undead),
				and(side(inputSide), inGraveyard, undead),
			);
		case CardIds.MesaduneTheFractured_WW_429:
			return and(side(inputSide), inDeck, elemental);
		case CardIds.MessengerBuzzard_WW_807:
			return and(side(inputSide), inDeck, beast);
		case CardIds.MicDrop:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.MimironsHead:
		case CardIds.MimironTheMastermind:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.MirrorDimension_TIME_006:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.MinecartCruiser_WW_326:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		// Mistah Vistah: Mage Tourist Battlecry: In 3 turns, replay every spell you've cast between now and then.
		case CardIds.MistahVistah_VAC_519:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.Mixtape:
			return tooltip(and(opposingSide(inputSide), cardsPlayedThisMatch));
		case CardIds.MoatLurker:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Morchie_END_036:
			return and(side(inputSide), or(inHand, inDeck), rewind);
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
		// Murkwater Scribe: Battlecry: The next spell you play costs (1) less.
		case CardIds.MurkwaterScribe:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.MuscleOTron_YOG_525:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.MutatingInjection_NAX11_04:
			return and(side(inputSide), or(inDeck, inHand), minion);
		// Myrmidon: After you cast a spell on this minion, draw a card.
		case CardIds.Myrmidon:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, canTargetFriendlyMinion);
		case CardIds.MysteriousChallenger:
		case CardIds.MysteriousChallenger_WON_334:
			return and(side(inputSide), inDeck, secret);
		case CardIds.MysteryEgg_TOY_351:
		case CardIds.MysteryEgg_MysteryEggToken_TOY_351t:
			return and(side(inputSide), inDeck, beast);
		// Naga Giant: Costs (1) less for each Mana you've spent on spells this game.
		case CardIds.NagaGiant:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.NagasPride:
			return and(side(inputSide), or(inDeck, inHand), naga);
		case CardIds.NaralexHeraldOfTheFlights_EDR_844:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.NaturalForceTavernBrawl:
			return and(side(inputSide), spell, nature, dealsDamage);
		case CardIds.NerubarWeblord:
			// Both sides
			return and(or(inDeck, inHand), minion, battlecry);
		case CardIds.NerubianFlyer:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NerubianVizier:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NecriumApothecary:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.NecriumBlade:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		// Necrium Vial: Trigger a friendly minion's Deathrattle twice.
		case CardIds.NecriumVial:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		case CardIds.NecroticMortician:
		case CardIds.NecroticMortician_CORE_RLK_116:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NespirahEnthralled_CATA_527:
			return and(side(inputSide), or(inHand, inDeck), spell, fel);
		case CardIds.NespirahEnthralled_NespirahUnshackledToken_CATA_527t2:
			return and(side(inputSide), or(inHand, inDeck), spell, fel);
		case CardIds.NetherBreath_DRG_205:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.NightbaneTemplar:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.NightmareFuel_EDR_528:
			return and(opposingSide(inputSide), inDeck, minion);
		case CardIds.NightmareLordXavius_EDR_856:
			return and(side(inputSide), inDeck, minion);
		case CardIds.NightshadeBud:
		case CardIds.NightshadeBud_CORE_REV_311:
			return highlightConditions(and(side(inputSide), inDeck, minion), and(side(inputSide), inDeck, spell));
		case CardIds.NineLives:
			return and(side(inputSide), or(inHand, inDeck, inGraveyard), minion, deathrattle);
		// Niri of the Crater: Whenever you play a 1-Cost minion, double its stats. Whenever you cast a 1-Cost spell, cast it twice.
		case CardIds.NiriOfTheCrater_TLC_836:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, effectiveCostEqual(1)),
				and(side(inputSide), or(inHand, inDeck), spellExtended, effectiveCostEqual(1)),
			);
		// Nordrassil Druid (CORE_CS3_012 / CS3_012): Battlecry: The next spell you cast this turn costs (3) less.
		case CardIds.NordrassilDruid:
		// Nordrassil Druid: Battlecry: The next spell you cast this turn costs (3) less.
		case CardIds.NordrassilDruidLegacy:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.NorthernNavigation:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, frost),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
		case CardIds.NostalgicInitiate_TOY_340:
		// Nostalgic Initiate: Mini The first time you cast a spell, gain +2/+2.
		case CardIds.NostalgicInitiate_NostalgicInitiateToken_TOY_340t1:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.NoxiousInfiltrator:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.NozdormuBronzeAspect_CATA_473:
			return and(side(inputSide), or(inHand, inDeck, inPlay), minion, divineShield);
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
		case CardIds.OffensivePlayTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, legendary);
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
		// Oops, All Spells!: Passive At the start of the game, destroy all minions in your deck. Your spells cost (1) less.
		case CardIds.OopsAllSpellsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
			return and(side(inputSide), or(inDeck, inHand), treant);
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
			return and(side(inputSide), or(inDeck, inHand), pirate);
		case CardIds.ParallaxCannon_GDB_843:
			return and(side(inputSide), or(inDeck, inHand), discover);
		// Parched Desperado: Battlecry: If you've cast a spell while holding this, give your hero +3 Attack this turn.
		case CardIds.ParchedDesperado_WW_407:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.ParrotSanctuary_VAC_409:
			return and(side(inputSide), or(inDeck, inHand), minion, battlecry);
		case CardIds.PartScrapper_MIS_902:
			return and(side(inputSide), or(inHand, inDeck), mech);
		case CardIds.PartyAnimal:
			return and(side(inputSide), or(inHand, inDeck), minion, not(tribeless));
		// Party Portal: Whenever you cast a spell, summon a random minion of the same Cost.
		case CardIds.PartyPortalTavernBrawl_PVPDR_SCH_Active08:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Pathmaker: Battlecry: Cast the other choice from the last Choose One spell you've cast.
		case CardIds.Pathmaker:
			return and(side(inputSide), or(inDeck, inHand), spell, chooseOne);
		case CardIds.PeacefulPiper:
			return and(side(inputSide), inDeck, beast);
		case CardIds.PendantOfEarth_DEEP_026:
			return and(side(inputSide), inDeck, minion);
		case CardIds.PebblyPage_WON_090:
			return and(side(inputSide), inDeck, overload);
		case CardIds.PetalPeddler_EDR_889:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.PetalPicker_FIR_921:
			return and(side(inputSide), or(inHand, inDeck), imbue);
		case CardIds.PetCollector:
			return and(side(inputSide), inDeck, beast, effectiveCostLess(6));
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
				and(side(inputSide), inDeck, divineShieldStrict),
				and(side(inputSide), inDeck, rush),
				and(side(inputSide), inDeck, taunt),
			);
		case CardIds.PipThePotent_WW_394:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(1));
		case CardIds.PitCommander:
			return and(side(inputSide), inDeck, demon);
		case CardIds.PitStop:
			return and(side(inputSide), inDeck, mech);
		// Plaguebringer: Passive Your spells Overload (1) and cost (2) less, but not less than (1).
		case CardIds.PlaguebringerTavernBrawl:
			return and(side(inputSide), spellExtended, effectiveCostMore(1));
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
		// Pop'gar the Putrid: Your Fel spells cost (2) less and have Lifesteal. Battlecry: Get two Barrels of Sludge.
		case CardIds.PopgarThePutrid_WW_091:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fel);
		case CardIds.PortalmancerSkyla_WORK_063:
			return and(side(inputSide), or(inDeck, inHand), spell);
		case CardIds.PortalVanguard_TIME_003:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.PossessedAnimancer_DINO_131:
			return and(side(inputSide), inDeck, beast);
		case CardIds.PotionOfIllusion:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.PotionOfSparkingTavernBrawl:
			return and(side(inputSide), minion, rush);
		case CardIds.PowerSlider:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, hasTribeNotPlayedThisMatch, not(tribeless)),
				and(side(inputSide), or(inHand, inDeck), minion, not(tribeless)),
			);
		case CardIds.PowerWordBarrier_TIME_447:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.PowerWordFortitude:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.PowerChordSynchronize:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.PrecursoryStrike_TIME_750:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, effectiveCostMore(4)),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.PredatoryInstincts:
			return and(side(inputSide), inDeck, beast);
		case CardIds.Predation:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.PreparationCore:
		case CardIds.PreparationLegacy:
		// Preparation: The next spell you cast this turn costs (3) less.
		case CardIds.PreparationVanilla:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Prescience:
			return highlightConditions(
				and(side(inputSide), inDeck, minion, costMore(4)),
				and(side(inputSide), inDeck, minion),
			);
		case CardIds.PrescientSlitherdrake_END_033:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.PressurePoints_GDB_881:
			return and(side(inputSide), or(inHand, inDeck), combo);
		// Priestess Valishj: Battlecry: Refresh an empty Mana Crystal for each spell you've cast this turn. (0)
		case CardIds.PriestessValishj:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.PrimalDungeoneer:
			return highlightConditions(
				and(side(inputSide), inDeck, nature, spell),
				and(side(inputSide), inDeck, spell),
				and(side(inputSide), inDeck, elemental),
			);
		case CardIds.PrimalfinChallenger_TLC_251:
			return and(side(inputSide), or(inHand, inDeck), kindred);
		// Primordial Overseer: Battlecry: If you've cast a Nature spell while holding this, gain +1/+1 and draw a card.
		case CardIds.PrimordialOverseer_TIME_213:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
		case CardIds.PrimordialProtector_BAR_042:
			return and(side(inputSide), inDeck, spell);
		case CardIds.PrinceLiam:
			return and(side(inputSide), inDeck, effectiveCostEqual(1));
		case CardIds.PrincessTavernBrawl:
			return and(side(inputSide), inDeck, minion, deathrattle);
		// Prison Breaker: Battlecry: If you've cast 5 or more spells this game, deal 2 damage to all enemies.
		case CardIds.PrisonBreaker_YOG_411:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.PrivateEye:
			return and(side(inputSide), inDeck, secret);
		case CardIds.PrismaticJewelKit:
			return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
		case CardIds.Product9_MIS_914:
			return highlightConditions(
				tooltip(and(side(inputSide), secretsTriggeredThisMatch)),
				and(side(inputSide), or(inDeck, inHand, inOther), secret),
			);
		case CardIds.ProstheticHand_DEEP_015:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), mech),
				and(side(inputSide), or(inDeck, inHand), undead),
			);
		case CardIds.ProvingGrounds:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Pufferfist:
			return and(side(inputSide), or(inHand, inDeck), givesHeroAttack);
		case CardIds.PuppetmasterDorian_MIS_026:
			return and(side(inputSide), inDeck, minion);
		case CardIds.Psychopomp:
			return and(side(inputSide), inGraveyard, minion);
		// Pyrotechnician: After you cast a spell, add a random Fire spell to your hand.
		case CardIds.Pyrotechnician:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.QualityAssurance_TOY_605:
			return and(side(inputSide), inDeck, minion, taunt);
		// Queen Azshara: Battlecry: If you've cast three spells while holding this, choose an Ancient Relic.
		case CardIds.QueenAzshara_TSC_641:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Queensguard: Battlecry: Gain +1/+1 for each spell you've cast this turn.
		case CardIds.Queensguard:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
		// Radiance of Azshara: Fire Spell Damage +2 Your Nature spells cost (1) less. After you cast a Frost spell, gain 3 Armor.
		case CardIds.RadianceOfAzshara_TSC_635:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended, fire),
				and(side(inputSide), or(inHand, inDeck), spellExtended, nature),
				and(side(inputSide), or(inHand, inDeck), spellExtended, frost),
			);
		case CardIds.RagingFelscreamerCore:
		case CardIds.RagingFelscreamer_BT_416:
			return and(side(inputSide), or(inDeck, inHand), demon);
		case CardIds.RagnarosTheGreatFire_CATA_150:
			return and(side(inputSide), or(inHand, inDeck, inPlay), deathrattle);
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
		// Raid the Sky Temple: Quest: Cast 10 spells. Reward: Ascendant Scroll.
		case CardIds.RaidTheSkyTemple:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		// Raincaller: After you cast a damage spell, gain +1/+1.
		case CardIds.Raincaller_CATA_487:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		// Raj Naz'jan: After you cast a spell, deal damage equal to its Cost to the enemy Hero.
		case CardIds.RajNazjan:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.Rally:
			return and(side(inputSide), inGraveyard, minion, effectiveCostLess(4), effectiveCostMore(0));
		case CardIds.RallyTheTroopsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), battlecry);
		// Rambunctious Stuffy: Rush After you cast a Frost spell, gain Reborn.
		case CardIds.RambunctiousStuffy_TOY_821:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, frost);
		case CardIds.RamkahenWildtamer:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.RangariScout_GDB_841:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.RangerGeneralSylvanas_RangerInitiateVereesaToken_TIME_609t2:
			return and(side(inputSide), inDeck, minion);
		case CardIds.RatchetPrivateer:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.ForestWardenOmu_RapidGrowth_THD_007p:
			return and(side(inputSide), or(inDeck, inHand), treant);
		case CardIds.Ravage_SC_004hp:
			return and(side(inputSide), or(inHand, inDeck), minion, zerg);
		case CardIds.RavenousFelfisher_CATA_529:
			return and(side(inputSide), or(inHand, inDeck), spell, fel);
		case CardIds.RavenousFelhunter_EDR_891:
			return and(side(inputSide), or(inHand, inDeck, inGraveyard), minion, deathrattle, baseCostLessThan(5));
		// Raylla, Sand Sculptor: Paladin Tourist After you cast a spell, summon a random 2-Cost minion and give it Divine Shield.
		case CardIds.RayllaSandSculptor_VAC_424:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Razorboar:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle, effectiveCostLess(4));
		case CardIds.RazorfenBeastmaster:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle, effectiveCostLess(5));
		case CardIds.RazormaneBattleguard:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		// Reach Equilibrium: Quest: Cast 4 Holy spells Reward: Life's Breath. Quest: Cast 4 Shadow spells. Reward: Death's Touch.
		case CardIds.ReachEquilibrium_TLC_817:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), holy, spellExtended),
				and(side(inputSide), or(inHand, inDeck), shadow, spellExtended),
			);
		// Cleanse the Shadow: Quest: Cast 4 Holy spells. Reward: Life's Breath.
		case CardIds.ReachEquilibrium_CleanseTheShadowToken_TLC_817t:
			return and(side(inputSide), or(inHand, inDeck), holy, spellExtended);
		// Corrupt the Light: Quest: Cast 4 Shadow spells. Reward: Death's Touch.
		case CardIds.ReachEquilibrium_CorruptTheLightToken_TLC_817t2:
			return and(side(inputSide), or(inHand, inDeck), shadow, spellExtended);
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
		case CardIds.ResplendentDreamweaver_EDR_860:
			return and(side(inputSide), or(inHand, inDeck), imbue);
		case CardIds.RestInPeace_VAC_457:
			return (input: SelectorInput): SelectorOutput => {
				const highestDeadMinionCost = Math.max(
					...input.deckState.minionsDeadThisMatch.map(
						(c) => c.effectiveCost ?? allCards.getCard(c.cardId).cost ?? 0,
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
			return tooltip(and(side(inputSide), inGraveyard, beast));
		case CardIds.Rewind_ETC_532:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, not(cardIs(CardIds.Rewind_ETC_532))),
				and(side(inputSide), inOther, spell, not(cardIs(CardIds.Rewind_ETC_532))),
			);
		// Rhonin's Scrying Orb: Passive The first spell you cast each turn costs (1) less.
		case CardIds.RhoninsScryingOrbTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.RhymeSpinner:
			return and(side(inputSide), or(inDeck, inHand), combo);
		case CardIds.RighteousReservesTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, divineShield);
		case CardIds.RimefangSwordCore:
		case CardIds.RimefangSword_LEG_RLK_710:
			return and(side(inputSide), or(inDeck, inHand), spell);
		// Rimescale Siren: Battlecry: If you've cast three spells while holding this, Freeze 3 random enemy minions.
		case CardIds.RimescaleSiren:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Rimetongue: After you cast a Frost spell, summon a 1/1 Elemental that Freezes.
		case CardIds.Rimetongue:
			return and(side(inputSide), or(inDeck, inHand), frost, spellExtended);
		case CardIds.RingmastersBaton:
			return highlightConditions(
				and(side(inputSide), inHand, dragon),
				and(side(inputSide), inHand, mech),
				and(side(inputSide), inHand, pirate),
			);
		case CardIds.RingmasterWhatley:
			return highlightConditions(
				and(side(inputSide), inDeck, dragon),
				and(side(inputSide), inDeck, mech),
				and(side(inputSide), inDeck, pirate),
			);
		case CardIds.RingOfBlackIceTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), freeze);
		case CardIds.RingOfPhaseshiftingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, legendary);
		// Ring of Refreshment: Passive After you cast a spell, refresh your Hero Power.
		case CardIds.RingOfRefreshmentTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.RippleInTime:
			return and(side(inputSide), inDeck, minion);
		case CardIds.RiskySkipper:
			return and(side(inputSide), or(inHand, inDeck), minion);
		// Ritual of the New Moon: Summon two random 3-Cost minions. (Cast 3 spells to summon 6-Cost minions instead.)
		case CardIds.RitualOfTheNewMoon_EDR_461:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		case CardIds.Robocaller_WORK_006:
			return (input: SelectorInput): SelectorOutput => {
				const found = input.parserState?.CurrentEntities?.get(entityId!);
				return and(
					side(inputSide),
					inDeck,
					or(
						baseCostEqual(getEntityTag(found, GameTag.TAG_SCRIPT_DATA_NUM_1, 0)),
						baseCostEqual(getEntityTag(found, GameTag.TAG_SCRIPT_DATA_NUM_2, 0)),
						baseCostEqual(getEntityTag(found, GameTag.TAG_SCRIPT_DATA_NUM_3, 0)),
					),
				)(input);
			};
		case CardIds.RobeOfTheMagi:
			return and(side(inputSide), or(inDeck, inHand), spell, dealsDamage);
		case CardIds.RobesOfShrinkingTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spell);
		// Ruby Sanctum: Your next Healing effect this turn deals damage instead.
		case CardIds.RubySanctum_CATA_301:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthStrict),
				and(side(inputSide), or(inDeck, inHand), lifesteal),
			);
		case CardIds.RocketBackpacksTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion, not(rush));
		case CardIds.RockMasterVoone_ETC_121:
			return and(side(inputSide), or(inDeck, inHand), minion, not(tribeless));
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
			return and(side(inputSide), inDeck, undead);
		case CardIds.RowdyPartner_WW_906:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostEqual(4));
		case CardIds.RoyalGreatswordTavernBrawlToken:
			return and(side(inputSide), inDeck, minion, legendary);
		case CardIds.RuinousVelocidrake_TIME_029:
			return highlightConditions(
				and(
					side(inputSide),
					inDeck,
					cardIs(CardIds.TwilightTimehopper_ShredOfTimeToken_TIME_025t as unknown as CardIds),
				),
				and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(
						CardIds.TachyonBarrage_TIME_027,
						CardIds.TwilightTimehopper_TIME_025,
						CardIds.EntropicContinuity_TIME_026,
					),
				),
			);
		case CardIds.RuneDagger:
			return and(side(inputSide), or(inHand, inDeck), spell, dealsDamage);
		case CardIds.RuneforgingCore:
		case CardIds.Runeforging_LEG_RLK_715:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.RuniTemporalGuardian_TIME_EVENT_998:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.RunningWild:
		case CardIds.RunningWild_RunningWild:
			return and(side(inputSide), inDeck, minion);
		case CardIds.RushTheStage:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.SailboatCaptain_VAC_937:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.SalhetsPride:
			return and(side(inputSide), inDeck, minion, healthLessThan(2));
		case CardIds.SaloonBrewmaster_WW_423:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Sandbinder:
			return and(side(inputSide), inDeck, elemental);
		// Sandfury Aura: Your minions' end of turn effects trigger twice. Lasts 3 turns.
		case CardIds.SandfuryAura_CATA_480:
			return and(side(inputSide), or(inHand, inDeck), minion, endOfTurn);
		// Saronite Shambler: Battlecry: If you've cast 5 or more spells this game, give your hero +4 Attack this turn.
		case CardIds.SaroniteShambler_YOG_521:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		// Scargil (DAL_726): "Your Murlocs cost (1)."
		case CardIds.Scargil:
			return and(side(inputSide), or(inHand, inDeck), murloc);
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
			return and(side(inputSide), inDeck, mech);
		case CardIds.SeafloorSavior_TSC_083:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SeascoutOperator_TSC_646:
			return and(side(inputSide), or(inHand, inDeck), mech);
		// Searing Reflection (FIR_941): Draw a minion. Summon an 8/8 copy of it with Divine Shield.
		case CardIds.SearingReflection_FIR_941:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SecurityAutomaton_TSC_928:
			return and(side(inputSide), or(inDeck, inHand), mech);
		case CardIds.SenseDemonsLegacy_EX1_317:
		case CardIds.SenseDemonsVanilla_VAN_EX1_317:
			return and(side(inputSide), inDeck, demon);
		case CardIds.Sentry_SC_764:
			return and(side(inputSide), or(inDeck, inHand), minion, protoss);
		case CardIds.SesselieOfTheFaeCourt_REV_319:
		case CardIds.SesselieOfTheFaeCourt_REV_782:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SecretStudiesTavernBrawl:
			return and(side(inputSide), inDeck, secret);
		case CardIds.SelectiveBreederCore:
		case CardIds.SelectiveBreeder_LEG_CS3_015:
			return and(side(inputSide), inDeck, beast);
		case CardIds.SelflessSidekick:
			return and(side(inputSide), inDeck, weapon);
		case CardIds.Serpentbloom:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.SerpentWig_TSC_215:
			return and(side(inputSide), or(inHand, inDeck), naga);
		case CardIds.ServiceBell:
			return and(side(inputSide), inDeck, not(neutral));
		// Sethekk Veilweaver: After you cast a spell on a minion, add a Priest spell to your hand.
		case CardIds.SethekkVeilweaver:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Shadehound:
		case CardIds.Shadehound_ShadehoundToken:
		case CardIds.Shadehound_CORE_MAW_009:
			return and(side(inputSide), or(inDeck, inHand, inPlay), beast);
		case CardIds.ShadestoneSkulker_DEEP_012:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.Shadowborn:
			return and(side(inputSide), or(inDeck, inHand), spell, shadow);
		case CardIds.Shadowcaster:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.Shadowcasting101TavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		// Shadowcloth Needle: After you cast a Shadow spell, deal 1 damage to all enemies. Lose 1 Durability.
		case CardIds.ShadowclothNeedle:
			return and(side(inputSide), or(inDeck, inHand), shadow, spellExtended);
		case CardIds.ShadowEssence_CORE_ICC_235:
		case CardIds.ShadowEssence_ICC_235:
			return and(side(inputSide), inDeck, minion);
		// Shadow of Demise: Each time you cast a spell, transform this into a copy of it.
		case CardIds.ShadowOfDemise_CORE_RLK_567:
		case CardIds.ShadowOfDemise:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Shadowtouched Kvaldir: Battlecry: Your next healing effect deals damage instead.
		case CardIds.ShadowtouchedKvaldir_YOG_300:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), restoreHealthStrict),
				and(side(inputSide), or(inDeck, inHand), lifesteal),
			);
		case CardIds.ShadowVisions:
			return and(side(inputSide), inDeck, spell);
		case CardIds.ShadowWordUndeath:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.ShadyDealer:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.Shaladrassil_EDR_846:
			return !card ? null : and(side(inputSide), or(inHand, inDeck), costMore(card.getEffectiveManaCost() ?? 0));
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
			return and(side(inputSide), or(inDeck, inHand), pirate);
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
		// Sha'tari Cloakfield: Elusive. Your first spell each turn costs (1) less. Starship Piece
		case CardIds.ShatariCloakfield_GDB_103:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Shellnado: Spend up to 5 Armor. For each spent, deal 1 damage to all minions.
		case CardIds.Shellnado_TLC_601:
			return and(side(inputSide), or(inHand, inDeck), givesArmor);
		// Shield Battery: Gain 6 Armor. Your next Protoss spell costs (2) less.
		case CardIds.ShieldBattery_SC_759:
			return and(side(inputSide), or(inHand, inDeck), protoss, spellExtended);
		case CardIds.ShieldSlamCore:
		case CardIds.ShieldSlamLegacy:
		case CardIds.ShieldSlamVanilla:
			return and(side(inputSide), or(inHand, inDeck), givesArmor);
		// Shirvallah, the Tiger: Divine Shield, Rush, Lifesteal Costs (1) less for each Mana you've spent on spells.
		case CardIds.ShirvallahTheTiger:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
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
		// Sinestra: Colossal +2. Your spells from other classes cast twice.
		case CardIds.Sinestra_CATA_154:
			return and(side(inputSide), or(inDeck, inHand), spell, fromAnotherClass);
		case CardIds.SkarrTheCatastrophe_WW_026:
			return and(side(inputSide), or(inHand, inDeck), elemental);
		case CardIds.SkeletalSidekickCore_RLK_958:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.SketchyInformation:
			return and(side(inputSide), inDeck, deathrattle, effectiveCostLess(5));
		case CardIds.SketchArtist_TOY_916:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.SkyClaw:
			return and(side(inputSide), or(inDeck, inHand), mech);
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
		// Slithering Deathscale: Battlecry: If you've cast three spells while holding this, deal 3 damage to all enemies.
		case CardIds.SlitheringDeathscale:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.SmallTimeBuccaneer:
		case CardIds.SmallTimeBuccaneer_WON_351:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		case CardIds.SmugglersCrate:
		case CardIds.SmugglersCrate_WON_347:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.Smokescreen:
			return and(side(inputSide), inDeck, deathrattle);
		case CardIds.SmolderingStrength_FIR_914:
			return and(side(inputSide), or(inDeck, inHand), minion);
		// Smolderthorn Lancer (TRL_326): Battlecry: If you're holding a Dragon, destroy a damaged enemy minion.
		case CardIds.SmolderthornLancer:
			return and(side(inputSide), or(inDeck, inHand), dragon);
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
		// Spectral Trainee: After you cast a spell, deal 1 damage to all enemy minions.
		case CardIds.SpectralTrainee:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Spellcoiler: Battlecry: If you've cast a spell while holding this, Discover a spell.
		case CardIds.Spellcoiler:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.SpellweaversBrilliance_CATA_452:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell, dealsDamage),
				and(side(inputSide), or(inHand, inDeck), spell),
			);
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
		case CardIds.SpiritOfTheRhino:
			return and(side(inputSide), or(inDeck, inHand), minion, rush);
		case CardIds.SpiritPeddler_WORK_015:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.SpiritGuide:
		case CardIds.SpiritGuide_CORE_AV_328:
			return highlightConditions(
				and(side(inputSide), inDeck, spell, shadow),
				and(side(inputSide), inDeck, spell, holy),
			);
		case CardIds.SpiritsingerUmbra:
			return and(side(inputSide), or(inHand, inDeck), minion, deathrattle);
		case CardIds.SplinteredReality_END_009:
			return and(side(inputSide), or(inHand, inDeck), treant);
		case CardIds.SplishSplashWhelp_WW_819:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.SpitefulSummoner:
			return and(side(inputSide), inDeck, spell);
		// Spitelash Siren: After you play a Naga, refresh two Mana Crystals. (Then switch!) / After you cast a spell, refresh two Mana Crystals. (Then switch!)
		case CardIds.SpitelashSiren:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spellExtended),
				and(side(inputSide), or(inHand, inDeck), naga),
			);
		case CardIds.SplittingAxe:
			return and(side(inputSide), or(inDeck, inHand), totem);
		case CardIds.SpontaneousCombustion_GDB_456:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.SolarFlare_GDB_305:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.Solitude_TIME_448:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SolarFlare_GDB_305:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.SpotTheDifference_TOY_374:
			return and(side(inputSide), inDeck, minion);
		// Spreading Saplings: Passive After you cast a Nature spell, summon a 1/1 Sapling.
		case CardIds.SpreadingSaplingsTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
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
		// Staff of Pain: Passive After you cast a Shadow spell, deal 2 damage to each hero.
		case CardIds.StaffOfPainTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, shadow);
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
					.sort((a, b) => (a.getEffectiveManaCost() ?? 0) - (b.getEffectiveManaCost() ?? 0))
					.reverse()
					.slice(0, numberToResurrect);
				const lastMinion = mostExpensiveMinions[mostExpensiveMinions.length - 1];
				return (
					side(inputSide)(input) &&
					minion(input) &&
					inGraveyard(input) &&
					(input.deckCard?.getEffectiveManaCost() ?? 0) >= (lastMinion?.getEffectiveManaCost() ?? 0)
				);
			};
		case CardIds.StageDive:
		case CardIds.StageDive_StageDive:
			return and(side(inputSide), inDeck, minion, rush);
		case CardIds.StakingAClaimTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.Stargazing_WW_425:
			return and(side(inputSide), inDeck, spell, arcane, not(cardIs(CardIds.Stargazing_WW_425)));
		// Starlight Groove: Give your hero Divine Shield. For the rest of the game, playing a Holy spell refreshes it.
		case CardIds.StarlightGroove:
			return and(side(inputSide), or(inDeck, inHand), holy, spellExtended);
		// Starlight Reactor: After you cast an Arcane spell, recast it (targets chosen randomly). Starship Piece
		case CardIds.StarlightReactor_GDB_108:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, arcane);
		case CardIds.StarlightWanderer_GDB_720:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		case CardIds.StarlightWhelp:
			return and(side(inputSide), inStartingHand);
		case CardIds.Starscryer:
			return and(side(inputSide), inDeck, spell);
		case CardIds.StarvingTavernBrawl:
			return and(side(inputSide), beast);
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
		case CardIds.StitchedGiant_LEG_RLK_744:
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
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.Stormrook_TIME_217:
			return and(side(inputSide), or(inDeck, inHand), spell, nature, dealsDamage);
		case CardIds.StormTheGates_TLC_EVENT_400:
			return and(side(inputSide), or(inDeck, inHand), or(beast, undead));
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
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), dragon),
				and(side(inputSide), inGraveyard, dragon),
			);
		case CardIds.Suffocate_GDB_476:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.SummerFlowerchild:
			return and(side(inputSide), inDeck, effectiveCostMore(5));
		case CardIds.SummonerDarkmarrow_VAC_503:
			return and(side(inputSide), or(inHand, inDeck), deathrattle);
		// Sunfury Champion: After you cast a Fire spell, deal 1 damage to all minions.
		case CardIds.SunfuryChampion:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fire);
		case CardIds.SunreaverWarmage:
			return and(side(inputSide), or(inDeck, inHand), spell, costMore(4));
		case CardIds.SunsapperLynessa_VAC_507:
			return and(side(inputSide), or(inDeck, inHand), spell, effectiveCostLess(3));
		// Sunstrider's Crown: Passive Every third spell you cast each turn costs (1).
		case CardIds.SunstridersCrownTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Sunwing Squawker: Battlecry: Repeat the last spell you've cast on a friendly minion on this.
		case CardIds.SunwingSquawker:
			return (input: SelectorInput): SelectorOutput => {
				const lastSpell = pickLast(input.deckState.spellsPlayedOnFriendlyMinions);
				return highlightConditions(
					tooltip(
						and(side(inputSide), entityIs({ entityId: lastSpell?.entityId, cardId: lastSpell?.cardId })),
					),
					and(side(inputSide), inDeck, spellExtended),
				)(input);
			};
		case CardIds.SuperchargeTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.SupplyRun_CATA_820:
		case CardIds.SupplyRun_SupplyRunToken_CATA_820t:
			return and(side(inputSide), inDeck, minion);
		case CardIds.SupremeDinomancy_TLC_828:
			return and(side(inputSide), or(inHand, inDeck, inPlay), beast);
		case CardIds.Surfalopod_VAC_443:
			return and(side(inputSide), inDeck, spell);
		case CardIds.SurvivalOfTheFittest:
			return and(side(inputSide), or(inHand, inDeck, inPlay), minion);
		case CardIds.Survivalist_CATA_613:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.SylvanassTriumph_CATA_557:
			return and(side(inputSide), or(inHand, inDeck), cardIs(CardIds.SylvanassTriumph_CATA_557));
		case CardIds.SwarthySwordshiner_VAC_701:
			return and(side(inputSide), or(inHand, inDeck), weapon);
		// Swiftscale Trickster: Battlecry: Your next spell this turn costs (0).
		case CardIds.SwiftscaleTrickster:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.Swindle:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), spell),
				and(side(inputSide), or(inHand, inDeck), minion),
			);
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
					.sort((a, b) => (b.getEffectiveManaCost() ?? 0) - (a.getEffectiveManaCost() ?? 0))[0];
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
					.sort((a, b) => (b.getEffectiveManaCost() ?? 0) - (a.getEffectiveManaCost() ?? 0))[0];
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
		// Talented Arcanist: Battlecry: Your next spell this turn has Spell Damage +2.
		case CardIds.TalentedArcanist:
			return and(side(inputSide), or(inHand, inDeck), spellExtended, dealsDamage);
		case CardIds.TamsinsPhylactery:
			return and(side(inputSide), minion, inGraveyard, deathrattle);
		// Tamsin Roame: Whenever you cast a Shadow spell that costs (1) or more, add a copy to your hand that costs (0).
		case CardIds.TamsinRoame_BAR_918:
			return and(side(inputSide), or(inHand, inDeck), shadow, spellExtended, effectiveCostMore(0));
		case CardIds.TangledWrath:
			return and(side(inputSide), inDeck, spell);
		case CardIds.TastyFlyfish:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TavishStormpike_BAR_038:
			return and(side(inputSide), inDeck, beast);
		case CardIds.Techysaurus_DINO_409:
			return and(side(inputSide), or(inHand, inDeck), notInInitialDeck);
		case CardIds.TendingDragonkin_FIR_960:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.TimberWolfLegacy:
		case CardIds.TimberWolfVanilla:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.TenGallonHat_WW_811:
			return and(side(inputSide), inDeck, minion);
		case CardIds.ToadOfTheWilds:
			return and(side(inputSide), or(inDeck, inHand), spell, nature);
		// Topior the Shrubbagazzor: Battlecry: For the rest of the game, after you cast a Nature spell, summon a 3/3 Whelp with Rush.
		case CardIds.TopiorTheShrubbagazzor:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, nature);
		case CardIds.TerrorscaleStalker:
		case CardIds.TerrorscaleStalker_CORE_UNG_800:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.TessGreymane_GIL_598:
		case CardIds.TessGreymaneCore:
			return highlightConditions(
				tooltip(and(side(inputSide), cardsPlayedThisMatch, fromAnotherClassStrict)),
				and(side(inputSide), or(inDeck, inHand), fromAnotherClass),
			);
		case CardIds.The8HandsFromBeyond_GDB_477:
			return (input: SelectorInput): SelectorOutput => {
				const orderedByCost = [...input.deckState.deck].sort(
					(a, b) => (b.getEffectiveManaCost() ?? 0) - (a.getEffectiveManaCost() ?? 0),
				);
				const highest8th =
					orderedByCost.length < 8 ? orderedByCost[orderedByCost.length - 1] : orderedByCost[7];
				const highest8thCost = highest8th?.getEffectiveManaCost() ?? 0;
				const candidates = orderedByCost
					.filter((c) => (c.getEffectiveManaCost() ?? 0) >= highest8thCost)
					.map((c) => c.cardId as CardIds);
				return and(side(inputSide), inDeck, cardIs(...candidates))(input);
			};
		// The Black Blood: Colossal +3. After you restore Health to a character, attack a random enemy minion.
		case CardIds.TheBlackBlood_CATA_300:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.TheBoomReaver:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TheBoomship:
			return and(side(inputSide), or(inHand, inDeck), minion);
		// The Countess: "Battlecry: If your deck has no Neutral cards, add 3 Legendary Invitations to your hand."
		case CardIds.TheCountess:
			return and(side(inputSide), inDeck, neutral);
		case CardIds.TheCurator_KAR_061:
		case CardIds.TheCurator_CORE_KAR_061:
			return and(side(inputSide), inDeck, minion, or(beast, dragon, murloc));
		case CardIds.TheDarkPortal_BT_302:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TheExodar_GDB_120:
			return and(side(inputSide), or(inDeck, inHand), starshipExtended);
		// The Eternal Hold: Discover any Demon that costs (5) or more. If your deck has no minions, your next one costs (0).
		case CardIds.TheEternalHold_TIME_446:
			return and(side(inputSide), inDeck, minion);
		// The Fist of Ra-den: After you cast a spell, summon a Legendary minion of that Cost. Lose 1 Durability.
		case CardIds.TheFistOfRaDen:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.TheFinsBeyondTime_TIME_706:
			return and(side(inputSide), inStartingHand);
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
		// The Galaxy's Lens: Spellburst: Absorb the spell's power!
		case CardIds.ExarchHataaru_TheGalaxysLensToken_GDB_136t:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// The Garden's Grace: Give a minion +4/+4 and Divine Shield. Costs (1) less for each Mana you've spent on Holy spells this game.
		case CardIds.TheGardensGrace:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, holy);
		case CardIds.GaronaHalforcen_TheKingslayersToken_TIME_875t1:
			return and(inDeck, legendary);
		// The Purator: "Battlecry: If your deck has no Neutral cards, draw a minion of each minion type."
		case CardIds.ThePurator:
			return and(side(inputSide), inDeck, neutral);
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
		// Phoenix Egg: Dormant. Cast a Fire spell to revive Thori'belore!
		case CardIds.Thoribelore_PhoenixEggToken_RLK_604t:
		case CardIds.Thoribelore_PhoenixEggToken_RLK_604t2:
		// Thori'belore: Rush. Deathrattle: Go Dormant. Cast a Fire spell to revive Thori'belore!
		case CardIds.Thoribelore:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fire);
		case CardIds.ThornmantleMusician:
			return and(side(inputSide), or(inDeck, inHand), beast);
		case CardIds.ThriveInTheShadowsCore:
			return and(side(inputSide), inDeck, spell);
		case CardIds.Thunderbringer_WW_440:
			return and(side(inputSide), inDeck, or(elemental, beast));
		case CardIds.Tichondrius_CORE_CATA_001:
			return and(side(inputSide), or(inHand, inDeck), demon);
		case CardIds.TidelostBurrower:
			return and(side(inputSide), or(inDeck, inHand), murloc);
		// Tidepool Pupil: Battlecry: If you've cast 3 spells while holding this, Discover one of them.
		case CardIds.TidepoolPupil_VAC_304:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		// Tide Pools: Discover a spell that costs (3) or less. After you cast a spell, reopen this.
		case CardIds.TidePools_VAC_522:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.TimberTambourine:
			return and(side(inputSide), or(inDeck, inHand), effectiveCostMore(4));
		case CardIds.TimelineAccelerator_WON_139:
			return and(side(inputSide), inDeck, mech);
		case CardIds.TimelineWitness:
			return and(side(inputSide), inDeck);
		case CardIds.TimelordNozdormu_TIME_063:
			return and(side(inputSide), or(inHand, inDeck), fromLatestExpansion);
		case CardIds.TimewayWanderer:
			return and(side(inputSide), inDeck, spell);
		case CardIds.TimethiefRafaam_TIME_005:
		case CardIds.TimethiefRafaam_GreenRafaamToken_TIME_005t2:
		case CardIds.TimethiefRafaam_MurlocRafaamToken_TIME_005t8:
		case CardIds.TimethiefRafaam_WarchiefRafaamToken_TIME_005t4:
		case CardIds.TimethiefRafaam_CalamitousRafaamToken_TIME_005t6:
		case CardIds.TimethiefRafaam_MindflayerRfaamToken_TIME_005t5:
		case CardIds.TimethiefRafaam_GiantRafaamToken_TIME_005t7:
		case CardIds.TimethiefRafaam_ArchmageRafaamToken_TIME_005t9:
			return and(side(inputSide), or(inHand, inDeck), rafaam);
		case CardIds.TimethiefRafaam_TinyRafaamToken_TIME_005t1:
		case CardIds.TimethiefRafaam_ExplorerRafaamToken_TIME_005t3:
			return and(side(inputSide), inDeck, rafaam);
		case CardIds.Timewarden:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TimewinderZarimi_TOY_385:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TinyfinsCaravan:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.TipTheScales:
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
		case CardIds.TotemicEvidence:
		case CardIds.TotemicEvidence_CORE_MAW_003:
			return and(side(inputSide), or(inDeck, inHand), totem);
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
			return and(side(inputSide), inDeck, mech);
		case CardIds.TravelmasterDungar_WORK_043:
			return and(side(inputSide), inDeck, minion);
		case CardIds.TreasureDistributor_TOY_518:
			return and(side(inputSide), or(inHand, inDeck), pirate);
		case CardIds.TreasureHunterEudora_VAC_464:
			return and(side(inputSide), or(inHand, inDeck), fromAnotherClass);
		case CardIds.TrenchSurveyor_TSC_642:
			return and(side(inputSide), inDeck, mech);
		case CardIds.TrialOfTheJormungars_WON_028:
			return and(side(inputSide), inDeck, beast, effectiveCostLess(4));
		case CardIds.Triangulate_GDB_451:
			return and(side(inputSide), inDeck, spell, not(cardIs(CardIds.Triangulate_GDB_451)));
		case CardIds.TrinketArtist_TOY_882:
			return highlightConditions(
				and(side(inputSide), inDeck, and(minion, divineShieldStrict)),
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
		case CardIds.TundraRhinoLegacy:
		case CardIds.TundraRhinoVanilla:
			return and(side(inputSide), or(inDeck, inHand), beast);
		// Tyr: Battlecry: Resurrect a 2-Attack, 3-Attack, and 4-Attack friendly minion.
		case CardIds.Tyr:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), currentClass, minion, attackGreaterThan(1), attackLessThan(5)),
				tooltip(
					and(side(inputSide), inGraveyard, currentClass, minion, attackGreaterThan(1), attackLessThan(5)),
				),
			);
		case CardIds.TyrsTears:
		case CardIds.TyrsTears_TyrsTearsToken:
			return highlightConditions(
				and(side(inputSide), or(inDeck, inHand), currentClass, minion),
				tooltip(and(side(inputSide), inGraveyard, currentClass, minion)),
			);
		// Tyrande: Battlecry: The next 3 spells you play cast twice.
		case CardIds.Tyrande_EDR_464:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Tuskpiercer:
		case CardIds.Tuskpiercer_CORE_BAR_330:
			return and(side(inputSide), inDeck, deathrattle, minion);
		case CardIds.TwilightDeceptor:
			return and(side(inputSide), inDeck, spell, shadow);
		case CardIds.TwilightGuardian:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.TwilightsCall:
			return and(side(inputSide), inGraveyard, minion, deathrattle);
		// Twinbow Terrorcoil: Battlecry: If you've cast a spell while holding this, your next spell casts twice.
		case CardIds.TwinbowTerrorcoil:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.TwistedTether:
			return and(side(inputSide), or(inHand, inDeck), undead);
		case CardIds.TwistedWebweaver_EDR_540:
			return (input: SelectorInput): SelectorOutput => {
				const candidates = input.deckState.cardsPlayedThisMatch.filter(
					(c) => allCards.getCard(c.cardId).type?.toUpperCase() === CardType[CardType.MINION],
				);
				return and(
					side(inputSide),
					or(inDeck, inHand),
					cardIs(...candidates.map((c) => c.cardId as CardIds)),
				)(input);
			};
		case CardIds.UmbralOwl:
		// Umbral Owl: Rush Costs (1) less for each spell you've cast this game.
		case CardIds.UmbralOwl_CORE_DMF_060:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.UmpiresGrasp_TOY_641:
			return and(side(inputSide), inDeck, demon);
		case CardIds.UnchainedGladiator:
			return and(side(inputSide), or(inDeck, inHand), elemental);
		case CardIds.UnderbrushTracker_TLC_520:
			return and(side(inputSide), or(inHand, inDeck), shufflesCardIntoDeck);
		case CardIds.UnderTheSea_VAC_431:
			return and(side(inputSide), inDeck, spell, not(cardIs(CardIds.UnderTheSea_VAC_431)));
		case CardIds.UndyingAllies:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.UnearthedArtifacts_TLC_462:
			return and(side(inputSide), or(inDeck, inHand), discover);
		case CardIds.UnearthedRaptor:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.UnendingSwarm:
			return tooltip(and(side(inputSide), inGraveyard, minion, effectiveCostLess(3)));
		case CardIds.UngoroBrochure_WORK_050:
			return and(side(inputSide), inDeck, minion);
		case CardIds.UnlivingChampion:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.UnlockedPotential:
			return and(side(inputSide), or(inDeck, inHand), minion, healthBiggerThanAttack);
		case CardIds.UnluckyPowderman_WW_367:
			return and(side(inputSide), or(inDeck, inHand), minion, taunt);
		// Unstable Magic: Passive After you cast an Arcane spell, transform a random enemy minion into a 1/1 Sheep.
		case CardIds.UnstableMagicTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, arcane);
		case CardIds.UntappedPotential:
		case CardIds.UntappedPotential_OssirianTear:
			return and(side(inputSide), or(inDeck, inHand), chooseOne);
		case CardIds.UnyieldingVindicator_GDB_232:
			return and(side(inputSide), or(inDeck, inHand), draenei);
		// Urchin Spines: Your spells this turn are Poisonous.
		case CardIds.UrchinSpines:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, dealsDamage);
		case CardIds.Ursatron:
			return and(side(inputSide), inDeck, mech);
		// case CardIds.UrsineMaul_EDR_253:
		// 	return (input: SelectorInput): SelectorOutput => {
		// 		const highestCostMinion = input.deckState.deck
		// 			.filter((c) => allCards.getCard(c.cardId).type === 'Minion')
		// 			.sort((a, b) => b.getEffectiveManaCost() - a.getEffectiveManaCost())[0];
		// 		const highestMinionCost = highestCostMinion?.getEffectiveManaCost() ?? 0;
		// 		return highlightConditions(
		// 			and(side(inputSide), inDeck, minion, effectiveCostEqual(highestMinionCost)),
		// 			and(side(inputSide), inDeck, minion),
		// 		)(input);
		// 	};
		case CardIds.Ursol_EDR_259:
			return and(side(inputSide), or(inHand, inDeck), spell);
		case CardIds.ValstannStaghelm_WON_345:
			return and(side(inputSide), inDeck, minion, taunt);
		case CardIds.VanndarStormpike_AV_223:
			return !!card
				? and(side(inputSide), inDeck, minion, effectiveCostLess((card.getEffectiveManaCost() ?? 0) + 1))
				: null;
		case CardIds.VarianKingOfStormwind:
			return highlightConditions(
				and(side(inputSide), inDeck, rush),
				and(side(inputSide), inDeck, taunt),
				and(side(inputSide), inDeck, divineShield),
			);
		case CardIds.VardenDawngrasp_BAR_748:
			return and(side(inputSide), or(inHand, inDeck), freeze);
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
		// Veteran Warmedic: After you cast a Holy spell, summon a 2/2 Medic with Lifesteal.
		case CardIds.VeteranWarmedic:
		case CardIds.VeteranWarmedic_CORE_BAR_878:
			return and(side(inputSide), or(inHand, inDeck), holy, spellExtended);
		case CardIds.VengefulSpirit_BAR_328:
			return and(side(inputSide), inDeck, minion, deathrattle);
		case CardIds.VengefulWalloper:
			return and(side(inputSide), or(inHand, inDeck), outcast);
		case CardIds.VentureCoMercenaryLegacy:
		case CardIds.VentureCoMercenaryVanilla:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.Vessina_ULD_173:
			return and(side(inputSide), or(inDeck, inHand), overload);
		// Vexallus: Your Arcane spells cast twice.
		case CardIds.Vexallus:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, arcane);
		case CardIds.ViciousBloodworm_RLK_711:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.ViciousSlitherspear_TSC_827:
		// Vicious Slitherspear: After you cast a spell, gain +1 Attack until your next turn.
		case CardIds.ViciousSlitherspear_CORE_TSC_827:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.VictorNefarius_CATA_470:
			return and(side(inputSide), or(inHand, inDeck), dragon);
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
		case CardIds.Warloc_CATA_180:
			return and(side(inputSide), or(inHand, inDeck), murloc, effectiveCostLess(4));
		// Warmaster Blackhorn (CATA_720): Battlecry: Destroy all cards that cost (2) or less in both player's hands and decks.
		case CardIds.WarmasterBlackhorn_CATA_720:
			return and(inDeck, effectiveCostLess(3));
		case CardIds.WarpDrive_GDB_474:
			return and(side(inputSide), or(inHand, inDeck), starshipExtended);
		case CardIds.WarpGate_SC_751:
			return and(side(inputSide), or(inHand, inDeck), protoss, minion);
		case CardIds.WayOfTheShell_TLC_513hp:
			return and(side(inputSide), inDeck, notInInitialDeck);
		case CardIds.ZereksCloningGallery:
			return and(side(inputSide), inDeck, minion);
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
		case CardIds.WelcomeHome_TIME_EVENT_997:
			return and(side(inputSide), or(inDeck, inHand), location);
		// Whirlweaver: Battlecry: If you've cast a spell last turn, Discover an Elemental.
		case CardIds.Whirlweaver:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.Wither:
			return and(side(inputSide), or(inDeck, inHand), undead);
		case CardIds.WickedBlightspawn_END_002:
			return and(side(inputSide), or(inDeck, inHand), weapon);
		case CardIds.WickedWitchdoctor:
		// Wicked Witchdoctor: Whenever you cast a spell, summon a random basic Totem.
		case CardIds.WickedWitchdoctor_WON_083:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.WidowbloomSeedsman:
			return and(side(inputSide), inDeck, spell, nature);
		case CardIds.WildPyromancerCore:
		case CardIds.WildPyromancerLegacy:
		// Wild Pyromancer: After you cast a spell, deal 1 damage to ALL minions.
		case CardIds.WildPyromancerVanilla:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
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
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.WingCommanderIchman_AV_336:
			return and(side(inputSide), inDeck, beast);
		// Wish of the New Moon: Deal $6 damage to a minion. (Cast 3 spells to gain Lifesteal.)
		case CardIds.WishOfTheNewMoon_EDR_460:
			return and(side(inputSide), or(inDeck, inHand), spellExtended);
		case CardIds.WishUponAStar_TOY_877:
			return and(side(inputSide), or(inDeck, inHand), minion);
		// Wither the Weak: Passive After you cast your first Fel spell in a turn, deal 1 damage to the lowest-Health enemy.
		case CardIds.WitherTheWeakTavernBrawl:
			return and(side(inputSide), or(inDeck, inHand), spellExtended, fel);
		case CardIds.Woecleaver:
			return and(side(inputSide), inDeck, minion);
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
		// Xyrella: Battlecry: If you've restored Health this turn, deal that much damage to all enemy minions.
		case CardIds.Xyrella_BAR_735:
			return and(side(inputSide), or(inHand, inDeck), restoreHealth);
		case CardIds.XyrellaTheDevout:
			return highlightConditions(
				and(side(inputSide), or(inHand, inDeck), minion, deathrattle),
				and(side(inputSide), inGraveyard, minion, deathrattle),
			);
		case CardIds.YellingYodeler:
			return and(side(inputSide), or(inDeck, inHand), minion, deathrattle);
		case CardIds.Yesterloc_TIME_428:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.YouthfulBrewmaster:
		case CardIds.YouthfulBrewmasterCore:
		case CardIds.YouthfulBrewmasterLegacy:
		case CardIds.YouthfulBrewmasterVanilla:
			return and(side(inputSide), or(inDeck, inHand), minion);
		case CardIds.YoggInTheBox_TOY_372:
			return and(side(inputSide), inDeck, minion);
		case CardIds.YoggSaronHopesEnd_OG_134:
		// Yogg-Saron, Master of Fate: Battlecry: If you've cast 10 spells this game, spin the Wheel of Yogg-Saron.
		case CardIds.YoggSaronMasterOfFate:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);
		case CardIds.YshaarjTheDefiler:
			return and(side(inputSide), cardsPlayedThisMatch, corrupted);
		case CardIds.YshaarjRageUnbound:
			return and(side(inputSide), inDeck, minion);
		// Ysiel Windsinger: Your spells cost (1).
		case CardIds.YsielWindsinger:
			return and(side(inputSide), or(inHand, inDeck), spellExtended);

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
		case CardIds.FyeTheSettingSun_WW_825:
		case CardIds.Chronobreaker:
		case CardIds.AlexstraszasChampion:
		case CardIds.DragonmawSentinel:
		case CardIds.DragonriderTalritha_DRG_235:
		case CardIds.LightningBreath:
		case CardIds.CandleBreath:
			return and(side(inputSide), or(inHand, inDeck), dragon);
		case CardIds.DragonfirePotion:
			return and(side(inputSide), or(inHand, inDeck, inPlay), dragon);
		case CardIds.DraconicHerald:
			return and(side(inputSide), or(inDeck, inHand), dragon);
		case CardIds.GrimscaleOracleLegacy:
		case CardIds.GrimscaleOracleVanilla:
		case CardIds.GrimscaleChum:
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
		case CardIds.MurlocTastyfin:
			return and(side(inputSide), inDeck, murloc);
		case CardIds.ShiverTheirTimbers:
		case CardIds.ToyBoat_TOY_505:
		case CardIds.Skybarge:
		case CardIds.SkyRaider:
		case CardIds.SkyRaider_CORE_DRG_024:
		case CardIds.MrSmite_DED_006:
		case CardIds.PirateAdmiralHooktusk:
			return and(side(inputSide), or(inHand, inDeck), pirate);

		case CardIds.TranquilClearing_MEND_044:
			return and(side(inputSide), or(inHand, inDeck), minion);
		case CardIds.TamePet_MEND_300:
		case CardIds.Spiritspeaker_MEND_301:
		case CardIds.MigratingElekk_MEND_303:
		case CardIds.TalyaEarthstrider_MEND_304:
			return animalCompanionSynergyDeckSelector(inputSide);
		case CardIds.NurturingNature_MEND_305:
			return and(side(inputSide), or(inHand, inDeck), beast);
		case CardIds.RoamFree_MEND_307:
			return animalCompanionSynergyDeckSelector(inputSide);
		case CardIds.LeyWalker_MEND_501:
		case CardIds.SurgeNeedle_MEND_503:
		case CardIds.MysticRunesaber_MEND_506:
			return leylineFranchiseSynergyDeckSelector(inputSide);
		case CardIds.DragonSoulShattered_BlueAspectEssenceToken_CATA_EVENT_110t3:
			return and(side(inputSide), inDeck, spell);
		case CardIds.BrashBattlemaster_MEND_800:
		case CardIds.ResilientSavior_MEND_801:
		case CardIds.EmboldeningBlade_MEND_803:
		case CardIds.AratorTheRedeemer_MEND_804:
			return silverHandRecruitSynergyDeckSelector(inputSide);
		case CardIds.Charity_MEND_805:
			return and(side(inputSide), or(inHand, inDeck), minion);
	}
	return null;
};

const hasTaunt = (cardId: string, entityId: number, deckState: DeckState, allCards: CardsFacadeService): boolean => {
	const result =
		getProcessedCard(cardId, entityId, deckState, allCards).mechanics?.includes(GameTag[GameTag.TAUNT]) ?? false;
	return result;
};
