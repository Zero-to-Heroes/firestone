import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

const DK_BLOOD_HAND = [
	CardIds.BloodBoil_RLK_730,
	CardIds.GnomeMuncherCore_RLK_720,
	CardIds.Soulstealer_RLK_741,
	CardIds.AlexandrosMograine,
	CardIds.VampiricBlood_RLK_051,
	CardIds.Asphyxiate_RLK_087,
	CardIds.ObliterateCore_RLK_125,
	CardIds.PatchwerkCore_RLK_071,
];
const DK_FROST_HAND = [
	CardIds.SchoolTeacher,
	CardIds.FrostwyrmsFury_RLK_063,
	CardIds.LadyDeathwhisper_RLK_713,
	CardIds.GlacialAdvance_RLK_512,
	CardIds.HornOfWinter_RLK_042,
	CardIds.ThassarianCore_RLK_223,
	CardIds.HowlingBlast_RLK_015,
	CardIds.FrostStrike,
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
	CardIds.AltruisTheOutcastToken_TOY_401t2,
	CardIds.MetamorphosisToken_TOY_400t6,
	CardIds.ImprisonedAntaenToken_TOY_400t4,
	CardIds.PriestessOfFuryToken_TOY_400t5,
	CardIds.EyeBeamToken_TOY_400t8,
];
const DRUID_HAND = [
	CardIds.KingTogwaggle,
	CardIds.TwigOfTheWorldTree,
	CardIds.MalfurionThePestilent_ICC_832,
	CardIds.NaturalizeLegacy,
	CardIds.AzalinaSoulthief,
	CardIds.LesserJasperSpellstone,
	CardIds.SpreadingPlague_CORE_ICC_054,
	CardIds.BranchingPaths,
];
const MAGE_HAND = [
	CardIds.IceLanceLegacy,
	CardIds.FireballLegacy,
	CardIds.IceBlockLegacy,
	CardIds.ArchmageAntonidasLegacy,
	CardIds.FrostboltLegacy,
	CardIds.Alexstrasza_CORE_VAN_EX1_561,
	CardIds.FrostNovaLegacy,
	CardIds.DoomsayerCore,
];
const HUNTER_HAND = [
	CardIds.LesserEmeraldSpellstone,
	CardIds.WanderingMonster,
	CardIds.MisdirectionLegacy,
	CardIds.ExplosiveTrapLegacy_EX1_610,
	CardIds.CatTrickCore,
	CardIds.DeathstalkerRexxar_ICC_828,
	CardIds.CloakedHuntress_CORE_KAR_006,
	CardIds.FreezingTrapCore,
];
const PALADIN_HAND = [
	CardIds.LadyLiadrin,
	CardIds.AldorTruthseeker,
	CardIds.LibramOfHope,
	CardIds.PenFlinger,
	CardIds.LibramOfJudgment,
	CardIds.LibramOfJustice_BT_011,
	CardIds.LibramOfWisdom_BT_025,
	CardIds.AldorAttendant,
];
const PRIEST_HAND = [
	CardIds.GalakrondTheUnspeakable,
	CardIds.SoulMirror,
	CardIds.KronxDragonhoof,
	CardIds.TimeRip,
	CardIds.FateWeaver,
	CardIds.DiscipleOfGalakrond,
	CardIds.ShieldOfGalakrond,
	CardIds.DevotedManiac,
];
const SHAMAN_HAND = [
	CardIds.HealingRain,
	CardIds.SaroniteChainGang_CORE_ICC_466,
	CardIds.Volcano,
	CardIds.Shudderwock_GIL_820,
	CardIds.ZolaTheGorgonCore,
	CardIds.LifedrinkerCore,
	CardIds.GrumbleWorldshaker,
	CardIds.GlacialShardCore,
];
const ROGUE_HAND = [
	CardIds.YouthfulBrewmasterLegacy,
	CardIds.PreparationLegacy,
	CardIds.VanishVanilla,
	CardIds.ShadowstepLegacy,
	CardIds.AntiqueHealbot,
	CardIds.GangUp,
	CardIds.BrannBronzebeard_LOE_077,
	CardIds.ColdlightOracleLegacy,
];
const WARRIOR_HAND = [
	CardIds.WhirlwindLegacy,
	CardIds.DeathsBite,
	CardIds.InnerRageLegacy,
	CardIds.WarsongCommander_CORE_EX1_084,
	CardIds.EmperorThaurissan_BRM_028,
	CardIds.GrimPatron,
	CardIds.FrothingBerserkerCore,
	CardIds.ExecuteCore,
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
			hand.map((cardId) => allCards.getCard(cardId).deckDuplicateDbfId ?? allCards.getCard(cardId).dbfId),
		);
	const playedCardBaseDbfId =
		allCards.getCard(playedCardBaseId).deckDuplicateDbfId ?? allCards.getCard(playedCardBaseId).dbfId;
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
