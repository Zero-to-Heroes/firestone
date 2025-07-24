import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

const DEMONHUNTER_HAND = [
	CardIds.TwinSliceToken_TOY_400t3,
	CardIds.SkullOfGuldanToken_TOY_401t,
	CardIds.ImprisonedAntaenToken_TOY_400t4,
	CardIds.AltruisTheOutcastToken_TOY_401t2,
	CardIds.WarglaivesOfAzzinothToken_TOY_400t7,
	CardIds.MetamorphosisToken_TOY_400t6,
	CardIds.PriestessOfFuryToken_TOY_400t5,
	CardIds.EyeBeamToken_TOY_400t8,
];
const DK_BLOOD_HAND = [
	CardIds.PatchwerkCore_RLK_071,
	CardIds.VampiricBlood_RLK_051,
	CardIds.ObliterateCore_RLK_125,
	CardIds.Soulstealer_RLK_741,
	CardIds.GnomeMuncherCore_RLK_720,
	CardIds.AlexandrosMograine,
	CardIds.BloodBoil_RLK_730,
	CardIds.Asphyxiate_RLK_087,
];
const DK_FROST_HAND = [
	CardIds.HowlingBlast_RLK_015,
	CardIds.FrostStrikeCore,
	CardIds.HornOfWinter_RLK_042,
	CardIds.ThassarianCore_RLK_223,
	CardIds.GlacialAdvance_RLK_512,
	CardIds.SchoolTeacher,
	CardIds.FrostwyrmsFury_RLK_063,
	CardIds.LadyDeathwhisper_RLK_713,
];
const DK_UNHOLY_HAND = [
	CardIds.PlagueStrike_RLK_018,
	CardIds.NerubianSwarmguard_RLK_062,
	CardIds.BattlefieldNecromancerCore_RLK_061,
	CardIds.Blightfang,
	CardIds.SkeletalSidekickCore_RLK_958,
	CardIds.AmalgamOfTheDeep,
	CardIds.HawkstriderRancher,
	CardIds.GraveStrengthCore_RLK_707,
];
const DRUID_HAND = [
	CardIds.AzalinaSoulthief,
	CardIds.TwigOfTheWorldTree,
	CardIds.KingTogwaggle,
	CardIds.MalfurionThePestilent_ICC_832,
	CardIds.MalfurionThePestilent_SpiderPlague,
	CardIds.MalfurionThePestilent_ScarabPlague,
	CardIds.BranchingPaths,
	CardIds.LesserJasperSpellstone,
	CardIds.SpreadingPlague_CORE_ICC_054,
	CardIds.NaturalizeLegacy,
];
const HUNTER_HAND = [
	CardIds.ExplosiveTrapLegacy_EX1_610,
	CardIds.FreezingTrapCore,
	CardIds.CloakedHuntress_CORE_KAR_006,
	CardIds.LesserEmeraldSpellstone,
	CardIds.DeathstalkerRexxar_ICC_828,
	CardIds.WanderingMonster,
	CardIds.MisdirectionLegacy,
	CardIds.CatTrickCore,
];
const MAGE_HAND = [
	CardIds.FrostNovaLegacy,
	CardIds.IceBlockLegacy,
	CardIds.DoomsayerCore,
	CardIds.Alexstrasza_CORE_VAN_EX1_561,
	CardIds.FrostboltLegacy,
	CardIds.ArchmageAntonidasLegacy,
	CardIds.IceLanceLegacy,
	CardIds.FireballLegacy,
];
const PALADIN_HAND = [
	CardIds.LadyLiadrin,
	CardIds.AldorAttendant,
	CardIds.PenFlinger,
	CardIds.AldorTruthseeker,
	CardIds.LibramOfWisdom_BT_025,
	CardIds.LibramOfJustice_BT_011,
	CardIds.LibramOfHope,
	CardIds.LibramOfJudgment,
];
const PRIEST_HAND = [
	CardIds.GalakrondTheUnspeakable,
	CardIds.GalakrondTheUnspeakable,
	CardIds.TimeRip,
	CardIds.SoulMirror,
	CardIds.DevotedManiac,
	CardIds.KronxDragonhoof,
	CardIds.ShieldOfGalakrond,
	CardIds.DiscipleOfGalakrond,
	CardIds.FateWeaver,
];
const ROGUE_HAND = [
	CardIds.AntiqueHealbot,
	CardIds.VanishVanilla,
	CardIds.YouthfulBrewmasterLegacy,
	CardIds.PreparationLegacy,
	CardIds.ShadowstepLegacy,
	CardIds.ColdlightOracleLegacy,
	CardIds.BrannBronzebeard_LOE_077,
	CardIds.GangUp,
];
const SHAMAN_HAND = [
	CardIds.Shudderwock_GIL_820,
	CardIds.LifedrinkerCore,
	CardIds.ZolaTheGorgonCore,
	CardIds.SaroniteChainGang_CORE_ICC_466,
	CardIds.GrumbleWorldshaker,
	CardIds.Volcano,
	CardIds.HealingRain,
	CardIds.GlacialShardCore,
];
const WARLOCK_HAND = [
	CardIds.FacelessManipulator,
	CardIds.SkullOfTheManari,
	CardIds.Voidlord_LOOT_368,
	CardIds.BloodreaverGuldan_ICC_831,
	CardIds.DefileCore,
	CardIds.CarnivorousCube,
	CardIds.DarkPact_LOOT_017,
	CardIds.DoomguardLegacy,
];
const WARRIOR_HAND = [
	CardIds.EmperorThaurissan_BRM_028,
	CardIds.InnerRageLegacy,
	CardIds.ExecuteCore,
	CardIds.DeathsBite,
	CardIds.WarsongCommander_CORE_EX1_084,
	CardIds.WhirlwindLegacy,
	CardIds.FrothingBerserkerCore,
	CardIds.GrimPatron,
];
export const ALL_HANDS = [
	DK_BLOOD_HAND,
	DK_FROST_HAND,
	DK_UNHOLY_HAND,
	DEMONHUNTER_HAND,
	DRUID_HAND,
	MAGE_HAND,
	HUNTER_HAND,
	PALADIN_HAND,
	PRIEST_HAND,
	SHAMAN_HAND,
	ROGUE_HAND,
	WARRIOR_HAND,
	WARLOCK_HAND,
];
let ALL_HANDS_DBFIDs = null;

export const updateHandWithStonebrewInfo = (
	playedCard: DeckCard,
	hand: readonly DeckCard[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	console.debug('[stonebrew] updating hand with stonebrew info', playedCard, hand);
	const playedCardBaseId = getBaseCardId(playedCard.cardId);
	for (const iconicHand of ALL_HANDS) {
		if (iconicHand.includes(playedCardBaseId as CardIds)) {
			console.debug(
				'[stonebrew] found iconic hand',
				iconicHand,
				playedCardBaseId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}

	// if I missed the correct ID, use the "base id" to still get something
	ALL_HANDS_DBFIDs =
		ALL_HANDS_DBFIDs ??
		ALL_HANDS.map((hand) =>
			hand.map((cardId) => allCards.getCard(cardId).counterpartCards?.[0] ?? allCards.getCard(cardId).dbfId),
		);
	const playedCardBaseDbfId =
		allCards.getCard(playedCardBaseId).counterpartCards?.[0] ?? allCards.getCard(playedCardBaseId).dbfId;
	for (const iconicHand of ALL_HANDS_DBFIDs) {
		if (iconicHand.includes(playedCardBaseDbfId)) {
			console.debug(
				'[stonebrew] found iconic hand with dbfid',
				iconicHand,
				playedCardBaseId,
				playedCardBaseDbfId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}
	console.warn('Could not find iconic hand for card', playedCardBaseId, playedCardBaseDbfId);
	return hand;
};

const newHand = (
	hand: readonly DeckCard[],
	iconicHand: readonly string[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	return hand.map((card) => {
		if (
			![CardIds.HarthStonebrew_CORE_GIFT_01, CardIds.HarthStonebrew_GIFT_01].includes(
				card.creatorCardId as CardIds,
			)
		) {
			return card;
		}
		const positionInIconicHand: number = card.creatorAdditionalInfo;
		const guessedCardId = iconicHand[positionInIconicHand];
		const refCard = allCards.getCard(guessedCardId);
		console.debug('[stonebrew] updating card', card, refCard, positionInIconicHand, iconicHand);
		return card.update({
			cardId: refCard.id,
			cardName: refCard.name,
			refManaCost: refCard.cost,
			rarity: refCard.rarity,
		});
	});
};
