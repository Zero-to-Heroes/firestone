import { ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';

export const getTrinketNameKey = (card: ReferenceCard): string => {
	if (card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.LESSER_TRINKET]) {
		return 'trinket-name-lesser';
	} else if (card.spellSchool?.toUpperCase() === SpellSchool[SpellSchool.GREATER_TRINKET]) {
		return 'trinket-name-greater';
	}
	return 'trinket-name';
};
