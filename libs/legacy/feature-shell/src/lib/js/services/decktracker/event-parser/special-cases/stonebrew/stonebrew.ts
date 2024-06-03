import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

const DK_BLOOD_HAND = [
	CardIds.BloodBoil_RLK_730,
	CardIds.GnomeMuncherCore_RLK_720,
	CardIds.Soulstealer_RLK_741,
	CardIds.Asphyxiate_RLK_087,
	CardIds.PatchwerkCore_RLK_071,
	CardIds.ObliterateCore_RLK_125,
	CardIds.AlexandrosMograine,
	CardIds.VampiricBlood_RLK_051,
];
const DK_FROST_HAND = [
	CardIds.FrostwyrmsFury_RLK_063,
	CardIds.FrostStrike,
	CardIds.LadyDeathwhisper_RLK_713,
	CardIds.GlacialAdvance_RLK_512,
	CardIds.SchoolTeacher,
	CardIds.HornOfWinter_RLK_042,
	CardIds.ThassarianCore_RLK_223,
	CardIds.HowlingBlast_RLK_015,
];
const DK_UNHOLY_HAND = [
	CardIds.GraveStrengthCore_RLK_707,
	CardIds.NerubianSwarmguard_RLK_062,
	CardIds.BattlefieldNecromancerCore_RLK_061,
	CardIds.PlagueStrike_RLK_018,
	CardIds.AmalgamOfTheDeep,
	CardIds.HawkstriderRancher,
	CardIds.SkeletalSidekickCore_RLK_958,
	CardIds.Blightfang,
];
const DEMONHUNTER_HAND = [
	CardIds.TwinSliceToken_TOY_400t3,
	CardIds.SkullOfGuldanToken_TOY_401t,
	CardIds.WarglaivesOfAzzinothToken_TOY_400t7,
	CardIds.ImprisonedAntaenToken_TOY_400t4,
	CardIds.PriestessOfFuryToken_TOY_400t5,
	CardIds.AltruisTheOutcastToken_TOY_401t2,
	CardIds.MetamorphosisToken_TOY_400t6,
	CardIds.EyeBeamToken_TOY_400t8,
];
const DRUID_HAND = [
	CardIds.TwigOfTheWorldTree,
	CardIds.MalfurionThePestilent_ICC_832,
	CardIds.BranchingPaths,
	CardIds.KingTogwaggle,
	CardIds.LesserJasperSpellstone,
	CardIds.AzalinaSoulthief,
	CardIds.NaturalizeLegacy,
	CardIds.SpreadingPlague_CORE_ICC_054,
];
const MAGE_HAND = [
	CardIds.DoomsayerCore,
	CardIds.ArchmageAntonidasLegacy,
	CardIds.FrostboltLegacy,
	CardIds.FireballLegacy,
	CardIds.IceLanceLegacy,
	CardIds.IceBlockLegacy,
	CardIds.Alexstrasza_CORE_VAN_EX1_561,
	CardIds.FrostNovaLegacy,
];
const HUNTER_HAND = [
	CardIds.LesserEmeraldSpellstone,
	CardIds.CloakedHuntress_CORE_KAR_006,
	CardIds.DeathstalkerRexxar_ICC_828,
	CardIds.WanderingMonster,
	CardIds.CatTrickCore,
	CardIds.ExplosiveTrapLegacy_EX1_610,
	CardIds.MisdirectionLegacy,
	CardIds.FreezingTrapCore,
];
const PALADIN_HAND = [
	CardIds.AldorTruthseeker,
	CardIds.LibramOfHope,
	CardIds.LadyLiadrin,
	CardIds.PenFlinger,
	CardIds.LibramOfJustice_BT_011,
	CardIds.LibramOfJudgment,
	CardIds.LibramOfWisdom_BT_025,
	CardIds.AldorAttendant,
];
const PRIEST_HAND = [
	CardIds.KronxDragonhoof,
	CardIds.ShieldOfGalakrond,
	CardIds.DevotedManiac,
	CardIds.SoulMirror,
	CardIds.GalakrondTheUnspeakable,
	CardIds.TimeRip,
	CardIds.FateWeaver,
	CardIds.DiscipleOfGalakrond,
];
const SHAMAN_HAND = [
	CardIds.LifedrinkerCore,
	CardIds.ZolaTheGorgonCore,
	CardIds.HealingRain,
	CardIds.GrumbleWorldshaker,
	CardIds.GlacialShardCore,
	CardIds.SaroniteChainGang_CORE_ICC_466,
	CardIds.Shudderwock_GIL_820,
	CardIds.Volcano,
];
const ROGUE_HAND = [
	CardIds.YouthfulBrewmasterLegacy,
	CardIds.BrannBronzebeard_LOE_077,
	CardIds.VanishVanilla,
	CardIds.PreparationLegacy,
	CardIds.ColdlightOracleLegacy,
	CardIds.ShadowstepLegacy,
	CardIds.AntiqueHealbot,
	CardIds.GangUp,
];
const WARRIOR_HAND = [
	CardIds.WhirlwindLegacy,
	CardIds.FrothingBerserkerCore,
	CardIds.ExecuteCore,
	CardIds.DeathsBite,
	CardIds.InnerRageLegacy,
	CardIds.WarsongCommander_CORE_EX1_084,
	CardIds.EmperorThaurissan_BRM_028,
	CardIds.GrimPatron,
];
const WARLOCK_HAND = [
	CardIds.DoomguardLegacy,
	CardIds.SkullOfTheManari,
	CardIds.CarnivorousCube,
	CardIds.FacelessManipulator,
	CardIds.Voidlord_LOOT_368,
	CardIds.DefileCore,
	CardIds.DarkPact_LOOT_017,
	CardIds.BloodreaverGuldan_ICC_831,
];
const ALL_HANDS = [
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
			manaCost: refCard.cost,
			rarity: refCard.rarity,
		});
	});
};
