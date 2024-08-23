import { CardIds, getEffectiveTribes, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';

export const getActualTribes = (
	card: ReferenceCard,
	groupMinionsIntoTheirTribeGroup: boolean,
	trinkets: readonly string[],
): readonly Race[] => {
	return [
		...getEffectiveTribes(card, groupMinionsIntoTheirTribeGroup).map((t) => Race[t]),
		...getSpecialTribesForEntity(card, trinkets),
	];
};

const getSpecialTribesForEntity = (card: ReferenceCard, trinkets: readonly string[]): readonly Race[] => {
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

export const getTrinketNameKey = (card: ReferenceCard): string => {
	if (card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.LESSER_TRINKET]) {
		return 'trinket-name-lesser';
	} else if (card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.GREATER_TRINKET]) {
		return 'trinket-name-greater';
	}
	return 'trinket-name';
};
