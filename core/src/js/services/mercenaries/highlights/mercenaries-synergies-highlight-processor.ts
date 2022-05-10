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
		case CardIds.Aluneth:
			return arcane;
		case CardIds.ArcaneBlast1Lettuce:
		case CardIds.ArcaneBlast2Lettuce:
		case CardIds.ArcaneBlast3Lettuce:
		case CardIds.ArcaneBlast4Lettuce:
		case CardIds.ArcaneBlast5Lettuce:
			return arcane;
		case CardIds.ArcaneBolt1Lettuce:
		case CardIds.ArcaneBolt2Lettuce:
		case CardIds.ArcaneBolt3Lettuce:
		case CardIds.ArcaneBolt4Lettuce:
		case CardIds.ArcaneBolt5Lettuce:
			return arcane;
		case CardIds.ArcaneLance1Lettuce:
		case CardIds.ArcaneLance2Lettuce:
		case CardIds.ArcaneLance3Lettuce:
		case CardIds.ArcaneLance4Lettuce:
		case CardIds.ArcaneLance5Lettuce:
			return arcane;
		case CardIds.ArcaneStaff1Lettuce:
		case CardIds.ArcaneStaff2Lettuce:
		case CardIds.ArcaneStaff3Lettuce:
		case CardIds.ArcaneStaff4Lettuce:
		case CardIds.ArcaneStaff5Lettuce:
			return arcane;
		case CardIds.Atiesh:
			return or(and(fire, dealsDamage), and(frost, dealsDamage));
		case CardIds.AvatarOfStormpike1Lettuce:
		case CardIds.AvatarOfStormpike2Lettuce:
		case CardIds.AvatarOfStormpike3Lettuce:
		case CardIds.AvatarOfStormpike4Lettuce:
			return dwarf;
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
			return or(nightelf, tauren, troll, and(nature, dealsDamage));
		case CardIds.BloodFrenzy1Lettuce:
		case CardIds.BloodFrenzy2Lettuce:
		case CardIds.BloodFrenzy3Lettuce:
		case CardIds.BloodFrenzy4Lettuce:
		case CardIds.BloodFrenzy5Lettuce:
			return orc;
		case CardIds.BloodPact1Lettuce:
		case CardIds.BloodPact2Lettuce:
		case CardIds.BloodPact3Lettuce:
		case CardIds.BloodPact4Lettuce:
		case CardIds.BloodPact5Lettuce:
			return or(orc, demon);
		case CardIds.BurningLegionTabard1Lettuce:
		case CardIds.BurningLegionTabard2Lettuce:
		case CardIds.BurningLegionTabard3Lettuce:
		case CardIds.BurningLegionTabard4Lettuce:
		case CardIds.BurningLegionTabard5Lettuce:
			return demon;
		case CardIds.CenarionSurge1Lettuce:
		case CardIds.CenarionSurge2Lettuce:
		case CardIds.CenarionSurge3Lettuce:
		case CardIds.CenarionSurge4Lettuce:
		case CardIds.CenarionSurge5Lettuce:
			return nature;
		case CardIds.ChromaticDragonflight1Lettuce:
		case CardIds.ChromaticDragonflight2Lettuce:
		case CardIds.ChromaticDragonflight3Lettuce:
		case CardIds.ChromaticDragonflight4Lettuce:
			return dragon;
		case CardIds.ChromaticInfusion1Lettuce:
		case CardIds.ChromaticInfusion2Lettuce:
		case CardIds.ChromaticInfusion3Lettuce:
		case CardIds.ChromaticInfusion4Lettuce:
		case CardIds.ChromaticInfusion5Lettuce:
			return dragon;
		case CardIds.CondemnLettuce:
			return holy;
		case CardIds.DarkShamanCowl1Lettuce:
		case CardIds.DarkShamanCowl2Lettuce:
		case CardIds.DarkShamanCowl3Lettuce:
		case CardIds.DarkShamanCowl4Lettuce:
		case CardIds.DarkShamanCowl5Lettuce:
			return horde;
		case CardIds.Demonfire1Lettuce:
		case CardIds.Demonfire2Lettuce:
		case CardIds.Demonfire3Lettuce:
		case CardIds.Demonfire4Lettuce:
		case CardIds.Demonfire5Lettuce:
			return demon;
		case CardIds.DemonSoul1Lettuce:
		case CardIds.DemonSoul2Lettuce:
		case CardIds.DemonSoul3Lettuce:
		case CardIds.DemonSoul4Lettuce:
			return and(fel, dealsDamage);
		case CardIds.DeepBreath1Lettuce:
		case CardIds.DeepBreath2Lettuce:
		case CardIds.DeepBreath3Lettuce:
		case CardIds.DeepBreath4Lettuce:
		case CardIds.DeepBreath5Lettuce:
			return and(fire, dealsDamage);
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
		// case CardIds.EnchantedRaven1:
		// case CardIds.EnchantedRaven2Lettuce:
		// case CardIds.EnchantedRaven3Lettuce:
		// 	return arcane;
		case CardIds.FamilyJusticeLettuce:
		case CardIds.FamilyDefenseLettuce:
			return (card: ReferenceCard) =>
				[CardIds.CarielRoameLettuce1, CardIds.CorneliusRoameLettuce1].includes(
					normalizeMercenariesCardId(card.id) as CardIds,
				);
		case CardIds.FelBlast1Lettuce:
		case CardIds.FelBlast2Lettuce:
		case CardIds.FelBlast3Lettuce:
		case CardIds.FelBlast4Lettuce:
		case CardIds.FelBlast5Lettuce:
			return fel;
		case CardIds.FelCorruption1Lettuce:
		case CardIds.FelCorruption2Lettuce:
		case CardIds.FelCorruption3Lettuce:
		case CardIds.FelCorruption4Lettuce:
		case CardIds.FelCorruption5Lettuce:
			return orc;
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff1Lettuce:
			return fel;
		case CardIds.FireballVolley1Lettuce:
		case CardIds.FireballVolley2Lettuce:
		case CardIds.FireballVolley3Lettuce:
		case CardIds.FireballVolley4Lettuce:
		case CardIds.FireballVolley5Lettuce:
			return fire;
		case CardIds.FireLance1Lettuce:
		case CardIds.FireLance2Lettuce:
		case CardIds.FireLance3Lettuce:
		case CardIds.FireLance4Lettuce:
		case CardIds.FireLance5Lettuce:
			return fire;
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
			return and(fire, dealsDamage);
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
		case CardIds.FrostBlast1Lettuce:
		case CardIds.FrostBlast2Lettuce:
		case CardIds.FrostBlast3Lettuce:
		case CardIds.FrostBlast4Lettuce:
		case CardIds.FrostBlast5Lettuce:
			return frost;
		case CardIds.FrostVolley1Lettuce:
		case CardIds.FrostVolley2Lettuce:
		case CardIds.FrostVolley3Lettuce:
		case CardIds.FrostVolley4Lettuce:
		case CardIds.FrostVolley5Lettuce:
			return frost;
		case CardIds.FrostStaff1Lettuce:
		case CardIds.FrostStaff2Lettuce:
		case CardIds.FrostStaff3Lettuce:
		case CardIds.FrostStaff4Lettuce:
		case CardIds.FrostStaff5Lettuce:
			return and(frost, dealsDamage);
		case CardIds.HeroicLeap1Lettuce:
		case CardIds.HeroicLeap2Lettuce:
		case CardIds.HeroicLeap3Lettuce:
		case CardIds.HeroicLeap4Lettuce:
		case CardIds.HeroicLeap5Lettuce:
			return human;
		case CardIds.HeatingUp1Lettuce:
		case CardIds.HeatingUp2Lettuce:
		case CardIds.HeatingUp3Lettuce:
		case CardIds.HeatingUp4Lettuce:
		case CardIds.HeatingUp5Lettuce:
			return fire;
		case CardIds.HolyShock1Lettuce:
		case CardIds.HolyShock2Lettuce:
		case CardIds.HolyShock3Lettuce:
		case CardIds.HolyShock4Lettuce:
		case CardIds.HolyShock5Lettuce:
			return holy;
		case CardIds.HolyStaff1Lettuce:
		case CardIds.HolyStaff2Lettuce:
		case CardIds.HolyStaff3Lettuce:
		case CardIds.HolyStaff4Lettuce:
		case CardIds.HolyStaff5Lettuce:
			return and(holy, dealsDamage);
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
		case CardIds.LifebindersLocket1Lettuce:
		case CardIds.LifebindersLocket2Lettuce:
		case CardIds.LifebindersLocket3Lettuce:
		case CardIds.LifebindersLocket4Lettuce:
		case CardIds.LifebindersLocket5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.LightningBolt1Lettuce:
		case CardIds.LightningBolt2Lettuce:
		case CardIds.LightningBolt3Lettuce:
		case CardIds.LightningBolt4Lettuce:
		case CardIds.LightningBolt5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.Manastorm1Lettuce:
		case CardIds.Manastorm2Lettuce:
		case CardIds.Manastorm3Lettuce:
		case CardIds.Manastorm4Lettuce:
		case CardIds.Manastorm5Lettuce:
			return and(arcane, dealsDamage);
		case CardIds.MarkOfTheViper1Lettuce:
		case CardIds.MarkOfTheViper2Lettuce:
		case CardIds.MarkOfTheViper3Lettuce:
		case CardIds.MarkOfTheViper4Lettuce:
		case CardIds.MarkOfTheViper5Lettuce:
			return or(nightelf, beast);
		case CardIds.MurkysLuckyFish1Lettuce:
		case CardIds.MurkysLuckyFish2Lettuce:
		case CardIds.MurkysLuckyFish3Lettuce:
		case CardIds.MurkysLuckyFish4Lettuce:
		case CardIds.MurkysLuckyFish5Lettuce:
			return murloc;
		case CardIds.MurlocInfestation1Lettuce:
		case CardIds.MurlocInfestation2Lettuce:
		case CardIds.MurlocInfestation3Lettuce:
		case CardIds.MurlocInfestation4Lettuce:
		case CardIds.MurlocInfestation5Lettuce:
			return murloc;
		case CardIds.NatureBlast1Lettuce:
		case CardIds.NatureBlast2Lettuce:
		case CardIds.NatureBlast3Lettuce:
		case CardIds.NatureBlast4Lettuce:
		case CardIds.NatureBlast5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.NatureStaff1Lettuce:
		case CardIds.NatureStaff2Lettuce:
		case CardIds.NatureStaff3Lettuce:
		case CardIds.NatureStaff4Lettuce:
		case CardIds.NatureStaff5Lettuce:
			return and(nature, dealsDamage);
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
		case CardIds.RodOfTheArchmageLettuce:
			return and(fire, dealsDamage);
		case CardIds.Scorch1Lettuce:
		case CardIds.Scorch2Lettuce:
		case CardIds.Scorch3Lettuce:
		case CardIds.Scorch4Lettuce:
		case CardIds.Scorch5Lettuce:
			return elemental;
		case CardIds.SearingStrike1Lettuce:
		case CardIds.SearingStrike2Lettuce:
		case CardIds.SearingStrike3Lettuce:
		case CardIds.SearingStrike4Lettuce:
		case CardIds.SearingStrike5Lettuce:
			return fire;
		case CardIds.Shadowflame1Lettuce1:
		case CardIds.Shadowflame2Lettuce1:
		case CardIds.Shadowflame3Lettuce1:
		case CardIds.Shadowflame4Lettuce1:
		case CardIds.Shadowflame5Lettuce1:
			return dragon;
		case CardIds.ShadowLance1Lettuce:
		case CardIds.ShadowLance2Lettuce:
		case CardIds.ShadowLance3Lettuce:
		case CardIds.ShadowLance4Lettuce:
		case CardIds.ShadowLance5Lettuce:
			return shadow;
		case CardIds.ShadowStaff1Lettuce:
		case CardIds.ShadowStaff2Lettuce:
		case CardIds.ShadowStaff3Lettuce:
		case CardIds.ShadowStaff4Lettuce:
		case CardIds.ShadowStaff5Lettuce:
			return and(shadow, dealsDamage);
		case CardIds.SnapFreeze1Lettuce:
		case CardIds.SnapFreeze2Lettuce:
		case CardIds.SnapFreeze3Lettuce:
		case CardIds.SnapFreeze4Lettuce:
		case CardIds.SnapFreeze5Lettuce:
			return freeze;
		case CardIds.SpareParts1Lettuce:
		case CardIds.SpareParts2Lettuce:
		case CardIds.SpareParts3Lettuce:
		case CardIds.SpareParts4Lettuce:
			return dragon;
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
		case CardIds.StrengthOfTheElements1Lettuce:
		case CardIds.StrengthOfTheElements2Lettuce:
		case CardIds.StrengthOfTheElements3Lettuce:
		case CardIds.StrengthOfTheElements4Lettuce:
		case CardIds.StrengthOfTheElements5Lettuce:
			return elemental;
		case CardIds.StrengthOfWrynn1Lettuce:
		case CardIds.StrengthOfWrynn2Lettuce:
		case CardIds.StrengthOfWrynn3Lettuce:
		case CardIds.StrengthOfWrynn4Lettuce:
		case CardIds.StrengthOfWrynn5Lettuce:
			return or(human, and(holy, dealsDamage));
		case CardIds.SurvivalTraining1Lettuce:
		case CardIds.SurvivalTraining2Lettuce:
		case CardIds.SurvivalTraining3Lettuce:
		case CardIds.SurvivalTraining4Lettuce:
		case CardIds.SurvivalTraining5Lettuce:
			return beast;
		case CardIds.TempestsFury1Lettuce:
		case CardIds.TempestsFury2Lettuce:
		case CardIds.TempestsFury3Lettuce:
		case CardIds.TempestsFury4Lettuce:
		case CardIds.TempestsFury5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.TheBeastWithin1Lettuce:
		case CardIds.TheBeastWithin2Lettuce:
		case CardIds.TheBeastWithin3Lettuce:
		case CardIds.TheBeastWithin4Lettuce:
		case CardIds.TheBeastWithin5Lettuce:
			return beast;
		case CardIds.TreasureChest1Lettuce:
		case CardIds.TreasureChest2Lettuce:
		case CardIds.TreasureChest3Lettuce:
		case CardIds.TreasureChest4Lettuce:
		case CardIds.TreasureChest5Lettuce:
			return pirate;
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
		case CardIds.ZhardoomGreatstaffOfTheDevourerLettuce:
			return or(and(shadow, dealsDamage), and(fel, dealsDamage));
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
const pirate = (card: ReferenceCard) => race(card, Race.PIRATE);

const spellSchool = (card: ReferenceCard, spellSchool: SpellSchool) =>
	SpellSchool[spellSchool] === card.spellSchool?.toUpperCase();
const arcane = (card: ReferenceCard) => spellSchool(card, SpellSchool.ARCANE);
const fire = (card: ReferenceCard) => spellSchool(card, SpellSchool.FIRE);
const holy = (card: ReferenceCard) => spellSchool(card, SpellSchool.HOLY);
const nature = (card: ReferenceCard) => spellSchool(card, SpellSchool.NATURE);
const frost = (card: ReferenceCard) => spellSchool(card, SpellSchool.FROST);
const fel = (card: ReferenceCard) => spellSchool(card, SpellSchool.FEL);
const shadow = (card: ReferenceCard) => spellSchool(card, SpellSchool.SHADOW);

// TODO translate
const hasText = (card: ReferenceCard, text: RegExp) => !!card.text?.toLowerCase()?.match(text);
const dealsDamage = (card: ReferenceCard) =>
	true || hasText(card, /deal \$?\{?\#?\d+\}? damage/) || hasText(card, /restore \$?\{?\#?\d+\}? health/);
const freeze = (card: ReferenceCard) => hasText(card, /freeze/);
