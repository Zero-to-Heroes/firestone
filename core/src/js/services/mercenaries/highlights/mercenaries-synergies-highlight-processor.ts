import { CardIds, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '../../cards-facade.service';
import { normalizeMercenariesCardId } from '../mercenaries-utils';
import { HighlightSelector } from './mercenaries-synergies-highlight.service';

export const buildSelector = (cardId: string, allCards: CardsFacadeService): HighlightSelector => {
	switch (cardId) {
		case CardIds.AllianceWarBanner1Lettuce:
		case CardIds.AllianceWarBanner2Lettuce:
		case CardIds.AllianceWarBanner3Lettuce:
		case CardIds.AllianceWarBanner4Lettuce:
		case CardIds.AllianceWarBanner5Lettuce:
			return alliance;
		case CardIds.ArcaneBolt1Lettuce1:
		case CardIds.ArcaneBolt2Lettuce1:
		case CardIds.ArcaneBolt3Lettuce1:
		case CardIds.ArcaneBolt4Lettuce1:
		case CardIds.ArcaneBolt5Lettuce1:
			return arcane;
		case CardIds.ArcaneStaff1Lettuce:
		case CardIds.ArcaneStaff2Lettuce:
		case CardIds.ArcaneStaff3Lettuce:
		case CardIds.ArcaneStaff4Lettuce:
		case CardIds.ArcaneStaff5Lettuce:
			return arcane;
		case CardIds.BannerOfTheHorde1Lettuce:
		case CardIds.BannerOfTheHorde2Lettuce:
		case CardIds.BannerOfTheHorde3Lettuce:
		case CardIds.BannerOfTheHorde4Lettuce:
		case CardIds.BannerOfTheHorde5Lettuce:
			return horde;
		case CardIds.BestialWrath1Lettuce:
		case CardIds.BestialWrath2Lettuce:
		case CardIds.BestialWrath3Lettuce:
		case CardIds.BestialWrath4Lettuce:
		case CardIds.BestialWrath5Lettuce:
			return beast;
		case CardIds.BlessingOfTheMoon1Lettuce:
		case CardIds.BlessingOfTheMoon2Lettuce:
		case CardIds.BlessingOfTheMoon3Lettuce:
		case CardIds.BlessingOfTheMoon4Lettuce:
		case CardIds.BlessingOfTheMoon5Lettuce:
			return or(nightelf, tauren, troll);
		case CardIds.BloodPact1Lettuce:
		case CardIds.BloodPact2Lettuce:
		case CardIds.BloodPact3Lettuce:
		case CardIds.BloodPact4Lettuce:
		case CardIds.BloodPact5Lettuce:
			return or(orc, demon);
		case CardIds.DarkShamanCowl1Lettuce:
		case CardIds.DarkShamanCowl2Lettuce:
		case CardIds.DarkShamanCowl3Lettuce:
		case CardIds.DarkShamanCowl4Lettuce:
		case CardIds.DarkShamanCowl5Lettuce:
			return horde;
		case CardIds.ElementaryStudies1Lettuce:
		case CardIds.ElementaryStudies2Lettuce:
		case CardIds.ElementaryStudies3Lettuce:
		case CardIds.ElementaryStudies4Lettuce:
		case CardIds.ElementaryStudies5Lettuce:
			return or(human, elemental, and(fire, dealsDamage));
		case CardIds.ElvenBanner1Lettuce:
		case CardIds.ElvenBanner2Lettuce:
		case CardIds.ElvenBanner3Lettuce:
		case CardIds.ElvenBanner4Lettuce:
		case CardIds.ElvenBanner5Lettuce:
			return or(nightelf, bloodelf);
		case CardIds.EnchantedRaven1Lettuce:
		case CardIds.EnchantedRaven2Lettuce:
		case CardIds.EnchantedRaven3Lettuce:
			return arcane;
		case CardIds.FamilyJusticeLettuce:
			return (card: ReferenceCard) =>
				[CardIds.CarielRoameLettuce1, CardIds.CorneliusRoameLettuce1].includes(
					normalizeMercenariesCardId(card.id) as CardIds,
				);
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
			return fel;
		case CardIds.FlameBuffet1Lettuce:
		case CardIds.FlameBuffet2Lettuce:
		case CardIds.FlameBuffet3Lettuce:
		case CardIds.FlameBuffet4Lettuce:
		case CardIds.FlameBuffet5Lettuce:
			return dragon;
		case CardIds.FireStaff1Lettuce:
		case CardIds.FireStaff2Lettuce:
		case CardIds.FireStaff3Lettuce:
		case CardIds.FireStaff4Lettuce:
		case CardIds.FireStaff5Lettuce:
			return fire;
		case CardIds.FishyBarrage1Lettuce:
		case CardIds.FishyBarrage2Lettuce:
		case CardIds.FishyBarrage3Lettuce:
		case CardIds.FishyBarrage4Lettuce:
		case CardIds.FishyBarrage5Lettuce:
			return murloc;
		case CardIds.ForTheFin1Lettuce:
		case CardIds.ForTheFin2Lettuce:
		case CardIds.ForTheFin3Lettuce:
		case CardIds.ForTheFin4Lettuce:
		case CardIds.ForTheFin5Lettuce:
			return murloc;
		case CardIds.FrostStaff1Lettuce:
		case CardIds.FrostStaff2Lettuce:
		case CardIds.FrostStaff3Lettuce:
		case CardIds.FrostStaff4Lettuce:
		case CardIds.FrostStaff5Lettuce:
			return frost;
		case CardIds.HeroicLeap1Lettuce:
		case CardIds.HeroicLeap2Lettuce:
		case CardIds.HeroicLeap3Lettuce:
		case CardIds.HeroicLeap4Lettuce:
		case CardIds.HeroicLeap5Lettuce:
			return human;
		case CardIds.HolyWordSalvation1Lettuce:
		case CardIds.HolyWordSalvation2Lettuce:
		case CardIds.HolyWordSalvation3Lettuce:
		case CardIds.HolyWordSalvation4Lettuce:
		case CardIds.HolyWordSalvation5Lettuce:
			return human;
		case CardIds.HuntingParty1Lettuce:
		case CardIds.HuntingParty2Lettuce:
		case CardIds.HuntingParty3Lettuce:
		case CardIds.HuntingParty4Lettuce:
		case CardIds.HuntingParty5Lettuce:
			return beast;
		case CardIds.InfernalCombustion1Lettuce:
		case CardIds.InfernalCombustion2Lettuce:
		case CardIds.InfernalCombustion3Lettuce:
		case CardIds.InfernalCombustion4Lettuce:
		case CardIds.InfernalCombustion5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.Inferno1Lettuce:
		case CardIds.Inferno2Lettuce:
		case CardIds.Inferno3Lettuce:
		case CardIds.Inferno4Lettuce:
		case CardIds.Inferno5Lettuce:
			return fire;
		case CardIds.LightningBolt1Lettuce1:
		case CardIds.LightningBolt2Lettuce1:
		case CardIds.LightningBolt3Lettuce1:
		case CardIds.LightningBolt4Lettuce1:
		case CardIds.LightningBolt5Lettuce1:
			return and(nature, dealsDamage);
		case CardIds.ManastormILettuce:
		case CardIds.ManastormIiLettuce:
		case CardIds.ManastormIiiLettuce:
		case CardIds.ManastormIvLettuce:
		case CardIds.ManastormVLettuce:
			return arcane;
		case CardIds.OrcOnslaught1Lettuce:
		case CardIds.OrcOnslaught2Lettuce:
		case CardIds.OrcOnslaught3Lettuce:
		case CardIds.OrcOnslaught4Lettuce:
		case CardIds.OrcOnslaught5Lettuce:
			return orc;
		case CardIds.OrgrimmarTabard1Lettuce:
		case CardIds.OrgrimmarTabard2Lettuce:
		case CardIds.OrgrimmarTabard3Lettuce:
		case CardIds.OrgrimmarTabard4Lettuce:
		case CardIds.OrgrimmarTabard5Lettuce:
			return orc;
		case CardIds.Scalelord1Lettuce:
		case CardIds.Scalelord2Lettuce:
		case CardIds.Scalelord3Lettuce:
			return murloc;
		case CardIds.SearingStrike1Lettuce:
		case CardIds.SearingStrike2Lettuce:
		case CardIds.SearingStrike3Lettuce:
		case CardIds.SearingStrike4Lettuce:
		case CardIds.SearingStrike5Lettuce:
			return fire;
		case CardIds.SplittingStrike1Lettuce:
		case CardIds.SplittingStrike2Lettuce:
		case CardIds.SplittingStrike3Lettuce:
		case CardIds.SplittingStrike4Lettuce:
		case CardIds.SplittingStrike5Lettuce:
			return human;
		case CardIds.StormwindTabard1Lettuce:
		case CardIds.StormwindTabard2Lettuce:
		case CardIds.StormwindTabard3Lettuce:
		case CardIds.StormwindTabard4Lettuce:
		case CardIds.StormwindTabard5Lettuce:
			return human;
		case CardIds.StrengthOfWrynn1Lettuce:
		case CardIds.StrengthOfWrynn2Lettuce:
		case CardIds.StrengthOfWrynn3Lettuce:
		case CardIds.StrengthOfWrynn4Lettuce:
		case CardIds.StrengthOfWrynn5Lettuce:
			return human;
		case CardIds.TempestsFuryILettuce:
		case CardIds.TempestsFuryIiLettuce:
		case CardIds.TempestsFuryIiiLettuce:
		case CardIds.TempestsFuryIvLettuce:
		case CardIds.TempestsFuryVLettuce:
			return and(nature, dealsDamage);
		case CardIds.TheBeastWithin1Lettuce:
		case CardIds.TheBeastWithin2Lettuce:
		case CardIds.TheBeastWithin3Lettuce:
		case CardIds.TheBeastWithin4Lettuce:
		case CardIds.TheBeastWithin5Lettuce:
			return beast;
		case CardIds.TribalWarfare1Lettuce:
		case CardIds.TribalWarfare2Lettuce:
		case CardIds.TribalWarfare3Lettuce:
		case CardIds.TribalWarfare4Lettuce:
		case CardIds.TribalWarfare5Lettuce:
			return orc;
		case CardIds.VelensBlessing1Lettuce:
		case CardIds.VelensBlessing2Lettuce:
		case CardIds.VelensBlessing3Lettuce:
		case CardIds.VelensBlessing4Lettuce:
		case CardIds.VelensBlessing5Lettuce:
			return holy;
		case CardIds.WarchiefsBlessing1Lettuce:
		case CardIds.WarchiefsBlessing2Lettuce:
		case CardIds.WarchiefsBlessing3Lettuce:
		case CardIds.WarchiefsBlessing4Lettuce:
		case CardIds.WarchiefsBlessing5Lettuce:
			return horde;
	}
};

const and = (...selectors: HighlightSelector[]): HighlightSelector => {
	return (card: ReferenceCard) => selectors.every((selector) => selector(card));
};

const or = (...selectors: HighlightSelector[]): HighlightSelector => {
	return (card: ReferenceCard) => selectors.some((selector) => selector(card));
};

const race = (card: ReferenceCard, race: Race) => Race[race] === card.race?.toUpperCase();
const orc = (card: ReferenceCard) => race(card, Race.ORC);
const troll = (card: ReferenceCard) => race(card, Race.TROLL);
const tauren = (card: ReferenceCard) => race(card, Race.TAUREN);
const undead = (card: ReferenceCard) => race(card, Race.UNDEAD);
const bloodelf = (card: ReferenceCard) => race(card, Race.BLOODELF);
const horde = or(orc, troll, tauren, undead, bloodelf);
const human = (card: ReferenceCard) => race(card, Race.HUMAN);
const dwarf = (card: ReferenceCard) => race(card, Race.DWARF);
const gnome = (card: ReferenceCard) => race(card, Race.GNOME);
const nightelf = (card: ReferenceCard) => race(card, Race.NIGHTELF);
const draenei = (card: ReferenceCard) => race(card, Race.DRAENEI);
const alliance = or(human, dwarf, gnome, nightelf, draenei);
const dragon = (card: ReferenceCard) => race(card, Race.DRAGON);
const murloc = (card: ReferenceCard) => race(card, Race.MURLOC);
const elemental = (card: ReferenceCard) => race(card, Race.ELEMENTAL);
const beast = (card: ReferenceCard) => race(card, Race.BEAST);
const demon = (card: ReferenceCard) => race(card, Race.DEMON);

const spellSchool = (card: ReferenceCard, spellSchool: SpellSchool) =>
	SpellSchool[spellSchool] === card.spellSchool?.toUpperCase();
const arcane = (card: ReferenceCard) => spellSchool(card, SpellSchool.ARCANE);
const fire = (card: ReferenceCard) => spellSchool(card, SpellSchool.FIRE);
const holy = (card: ReferenceCard) => spellSchool(card, SpellSchool.HOLY);
const nature = (card: ReferenceCard) => spellSchool(card, SpellSchool.NATURE);
const frost = (card: ReferenceCard) => spellSchool(card, SpellSchool.FROST);
const fel = (card: ReferenceCard) => spellSchool(card, SpellSchool.FEL);

const hasText = (card: ReferenceCard, text: RegExp) => !!card.text?.match(text);
const dealsDamage = (card: ReferenceCard) => hasText(card, /deal \d+ damage/);
