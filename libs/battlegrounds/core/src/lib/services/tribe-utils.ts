/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, CardType, getEffectiveTribes, getTribeName, Race, ReferenceCard } from '@firestone-hs/reference-data';

export const getActualTribes = (
	card: ReferenceCard,
	groupMinionsIntoTheirTribeGroup: boolean,
	trinkets: readonly string[] | undefined,
	anomalies: readonly string[] | undefined,
): readonly Race[] => {
	if (
		anomalies?.includes(CardIds.IncubationMutation_BG31_Anomaly_112) &&
		card.type?.toUpperCase() === CardType[CardType.MINION] &&
		!card.races?.length
	) {
		return [Race.ALL];
	}
	return [
		...getEffectiveTribes(card, groupMinionsIntoTheirTribeGroup).map((t) => Race[t]),
		...getSpecialTribesForEntity(card, trinkets),
	];
};

const getSpecialTribesForEntity = (card: ReferenceCard, trinkets: readonly string[] | undefined): readonly Race[] => {
	switch (card.id) {
		case CardIds.WhelpSmuggler_BG21_013:
		case CardIds.WhelpSmuggler_BG21_013_G:
			return trinkets?.some((t) => t === CardIds.SmugglerPortrait_BG30_MagicItem_825) ? [Race.DRAGON] : [];
		case CardIds.LightfangEnforcer_BGS_009:
		case CardIds.LightfangEnforcer_TB_BaconUps_082:
			return trinkets?.some((t) => t === CardIds.EnforcerPortrait_BG30_MagicItem_971) ? [Race.ALL] : [];
		case CardIds.BrannBronzebeard_BG_LOE_077:
		case CardIds.BrannBronzebeard_TB_BaconUps_045:
			return trinkets?.some((t) => t === CardIds.BronzebeardPortrait_BG30_MagicItem_418)
				? [Race.DRAGON, Race.MURLOC]
				: [];
	}
	return [];
};

export const compareTribes = (
	a: Race | null,
	b: Race | null,
	i18n: { translateString: (key: string) => string },
): number => {
	if (a === Race.BLANK || a == null) {
		return 1;
	}
	if (b === Race.BLANK || a == null) {
		return -1;
	}
	if (a === Race.ALL) {
		return 1;
	}
	if (b === Race.ALL) {
		return -1;
	}
	return getTribeName(a!, i18n).localeCompare(getTribeName(b!, i18n));
};
