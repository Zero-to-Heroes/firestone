import { CardIds, CardRules, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { ExtendedReferenceCard } from '../tiers.model';

export const filterCardsToInclude = (
	cardsInGame: readonly ReferenceCard[],
	tiersToInclude: readonly number[],
	anomalies: readonly string[],
	playerCardId: string,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): readonly ExtendedReferenceCard[] => {
	const filteredCards: readonly ExtendedReferenceCard[] = cardsInGame
		.filter(
			(card) =>
				tiersToInclude.includes(card.techLevel as number) ||
				card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET],
		)
		.map((card) => enhanceCard(card, anomalies, playerCardId, cardRules, allCards, i18n));
	return filteredCards;
};

const enhanceCard = (
	card: ReferenceCard,
	anomalies: readonly string[],
	playerCardId: string,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): ExtendedReferenceCard => {
	const { banned, bannedReason } = isBanned(card, anomalies, playerCardId, cardRules, allCards, i18n);
	const result: ExtendedReferenceCard = {
		...card,
		banned: banned,
		bannedReason: bannedReason,
	};
	return result;
};

const isBanned = (
	card: ReferenceCard,
	anomalies: readonly string[],
	playerCardId: string,
	cardRules: CardRules,
	allCards: CardsFacadeService,
	i18n: { translateString: (toTranslate: string, params?: any) => string },
): { banned: boolean; bannedReason: string | null } => {
	if (isCardExcludedByAnomaly(card, anomalies)) {
		return { banned: true, bannedReason: 'anomaly' };
	}
	if (isCardExcludedForPlayer(card, playerCardId, cardRules)) {
		return {
			banned: true,
			bannedReason: i18n.translateString('battlegrounds.in-game.minions-list.banned-reason.hero', {
				heroName: allCards.getCard(playerCardId).name,
			}),
		};
	}
	return { banned: false, bannedReason: null };
};

const isCardExcludedForPlayer = (card: ReferenceCard, playerCardId: string, cardRules: CardRules): boolean => {
	const cardRule = cardRules?.[card.id];
	return !!cardRule?.bgsMinionTypesRules?.bannedForHeroes?.includes(playerCardId);
};

const isCardExcludedByAnomaly = (card: ReferenceCard, anomalies: readonly string[]): boolean => {
	if (anomalies.includes(CardIds.UncompensatedUpset_BG27_Anomaly_721)) {
		return [
			CardIds.CorpseRefiner_BG25_033,
			CardIds.CorpseRefiner_BG25_033_G,
			// CardIds.TimeSaver_BG27_520,
			// CardIds.TimeSaver_BG27_520_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.PackedStands_BG27_Anomaly_750)) {
		return [CardIds.SeabornSummoner_BG27_012, CardIds.SeabornSummoner_BG27_012_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.FalseIdols_BG27_Anomaly_301)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	} else if (anomalies.includes(CardIds.TheGoldenArena_BG27_Anomaly_801)) {
		return [
			CardIds.TreasureSeekerElise_BG23_353,
			CardIds.TreasureSeekerElise_BG23_353_G,
			CardIds.CaptainSanders_BG25_034,
			CardIds.CaptainSanders_BG25_034_G,
			// CardIds.UpbeatImpressionist_BG26_124,
			// CardIds.UpbeatImpressionist_BG26_124_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.AFaireReward_BG27_Anomaly_755)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	} else if (
		anomalies.some((a) =>
			[
				CardIds.OopsAllBeastsToken_BG27_Anomaly_104t,
				CardIds.OopsAllDemonsToken_BG27_Anomaly_104t2,
				CardIds.OopsAllDragonsToken_BG27_Anomaly_104t3,
				CardIds.OopsAllElementalsToken_BG27_Anomaly_104t4,
				CardIds.OopsAllEvil_BG27_Anomaly_307,
				CardIds.OopsAllMechsToken_BG27_Anomaly_104t5,
				CardIds.OopsAllMurlocsToken_BG27_Anomaly_104t6,
				CardIds.OopsAllNagaToken_BG27_Anomaly_104t7,
				CardIds.OopsAllPiratesToken_BG27_Anomaly_104t10,
				CardIds.OopsAllQuilboarToken_BG27_Anomaly_104t8,
			].includes(a as CardIds),
		)
	) {
		return [
			CardIds.MenagerieMug_BGS_082,
			CardIds.MenagerieMug_TB_BaconUps_144,
			CardIds.MenagerieJug_BGS_083,
			CardIds.MenagerieJug_TB_BaconUps_145,
			CardIds.ReefExplorer_BG23_016,
			CardIds.ReefExplorer_BG23_016_G,
			CardIds.LivingConstellation_BG27_001,
			CardIds.LivingConstellation_BG27_001_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.BigLeague_BG27_Anomaly_100)) {
		return [
			CardIds.TheBoogieMonster_BG26_176,
			CardIds.TheBoogieMonster_BG26_176_G,
			CardIds.PatientScout_BG24_715,
			CardIds.PatientScout_BG24_715_G,
			CardIds.FacelessDisciple_BG24_719,
			CardIds.FacelessDisciple_BG24_719_G,
			CardIds.KingVarian_BG27_508,
			CardIds.KingVarian_BG27_508_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.LittleLeague_BG27_Anomaly_800)) {
		return [
			CardIds.TheBoogieMonster_BG26_176,
			CardIds.TheBoogieMonster_BG26_176_G,
			CardIds.PatientScout_BG24_715,
			CardIds.PatientScout_BG24_715_G,
			CardIds.FacelessDisciple_BG24_719,
			CardIds.FacelessDisciple_BG24_719_G,
			CardIds.KingVarian_BG27_508,
			CardIds.KingVarian_BG27_508_G,
		].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.GolgannethsTempest_BG27_Anomaly_900)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
		// } else if (anomalies.includes(CardIds.ShacklesOfThePrimus_BG27_Anomaly_724)) {
		// 	return [
		// 		CardIds.PatientScout_BG24_715,
		// 		CardIds.PatientScout_BG24_715_G,
		// 		CardIds.UpbeatDuo_BG26_199,
		// 		CardIds.UpbeatDuo_BG26_199_G,
		// 		CardIds.UpbeatFlutist_BG26_352,
		// 		CardIds.UpbeatFlutist_BG26_352_G,
		// 		CardIds.UpbeatUpstart_BG26_120,
		// 		CardIds.UpbeatUpstart_BG26_120_G,
		// 		CardIds.UpbeatFrontdrake_BG26_529,
		// 		CardIds.UpbeatFrontdrake_BG26_529_G,
		// 		CardIds.UpbeatImpressionist_BG26_124,
		// 		CardIds.UpbeatImpressionist_BG26_124_G,
		// 	].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.CurseOfAggramar_BG27_Anomaly_006)) {
		return [CardIds.Dreadbeard_BG27_011, CardIds.Dreadbeard_BG27_011_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.TavernSpecial_BG27_Anomaly_103)) {
		return [CardIds.SeabornSummoner_BG27_012, CardIds.SeabornSummoner_BG27_012_G].includes(card.id as CardIds);
	} else if (anomalies.includes(CardIds.ValuationInflation_BG27_Anomaly_556)) {
		return [CardIds.TreasureSeekerElise_BG23_353, CardIds.TreasureSeekerElise_BG23_353_G].includes(
			card.id as CardIds,
		);
	}
	return false;
};
