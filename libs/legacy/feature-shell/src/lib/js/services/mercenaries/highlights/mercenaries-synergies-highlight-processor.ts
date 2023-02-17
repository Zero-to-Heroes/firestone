import { CardIds, GameTag, Race, ReferenceCard, SpellSchool, TagRole } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { normalizeMercenariesCardId } from '../mercenaries-utils';
import { HighlightSelector } from './mercenaries-synergies-highlight.service';

export const buildSelector = (cardId: string, allCards: CardsFacadeService): HighlightSelector => {
	const refCard = allCards.getCard(cardId);

	switch (cardId) {
		case CardIds.AllianceWarBanner5Lettuce:
			return alliance;
		case CardIds.Aluneth5Lettuce:
			return and(dealsDamage, arcane);
		case CardIds.ArcaneBlast5Lettuce:
			return arcaneSpellPower;
		case CardIds.APiratesLife5Lettuce:
			return pirate;
		case CardIds.ArcaneBolt1Lettuce:
		case CardIds.ArcaneBolt2Lettuce:
		case CardIds.ArcaneBolt3Lettuce:
		case CardIds.ArcaneBolt4Lettuce:
		case CardIds.ArcaneBolt5Lettuce:
			return arcane;
		case CardIds.ArcaneLance5Lettuce:
			return arcane;
		case CardIds.ArcaneRitual5Lettuce:
			return and(dealsDamage, arcane);
		case CardIds.ArcaneStaff5Lettuce:
			return arcane;
		case CardIds.ArcaneVolley5Lettuce:
			return arcane;
		case CardIds.AshfallenRebuke5Lettuce:
			return and(dealsDamage, fel);
		case CardIds.Atiesh5Lettuce:
			return and(dealsDamage, or(fire, frost));
		case CardIds.AvatarOfStormpike1Lettuce:
		case CardIds.AvatarOfStormpike2Lettuce:
		case CardIds.AvatarOfStormpike3Lettuce:
		case CardIds.AvatarOfStormpike5Lettuce:
			return dwarf;
		case CardIds.AzsharanInfluence5Lettuce:
			return or(dealsDamage, naga);
		case CardIds.BakuTheMooneater5Lettuce:
			return speedIsOdd;
		case CardIds.BannerOfTheHorde5Lettuce:
			return horde;
		case CardIds.BaronsBoon5Lettuce:
			return deathrattle;
		case CardIds.BestialWrath5Lettuce:
			return beast;
		case CardIds.BirdBuddy5Lettuce:
			return speedIsEven;
		case CardIds.BlessingOfTheMoon5Lettuce:
			return or(nightelf, tauren, troll, and(nature, dealsDamage));
		case CardIds.BloodFrenzy1Lettuce:
		case CardIds.BloodFrenzy2Lettuce:
		case CardIds.BloodFrenzy3Lettuce:
		case CardIds.BloodFrenzy4Lettuce:
		case CardIds.BloodFrenzy5Lettuce:
			return orc;
		case CardIds.BloodPact5Lettuce:
			return or(orc, demon);
		case CardIds.BoonOfAtiesh2Lettuce:
		case CardIds.BoonOfAtiesh3Lettuce:
		case CardIds.BoonOfAtiesh5Lettuce:
			return and(dealsDamage, or(fire, frost, arcane));
		case CardIds.BowlOfBones5Lettuce:
			return summon;
		case CardIds.BrilliantAmity5Lettuce:
			return taunt;
		case CardIds.BurningLegionTabard5Lettuce:
			return demon;
		case CardIds.CallOfTheDeep5Lettuce:
			return naga;
		case CardIds.CantTouchThis5Lettuce:
			return taunt;
		case CardIds.CastThemOverboard5Lettuce:
			return caster;
		case CardIds.CelestialProtection5Lettuce:
			return celestial;
		case CardIds.CenarionSurge1Lettuce:
		case CardIds.CenarionSurge2Lettuce:
		case CardIds.CenarionSurge3Lettuce:
		case CardIds.CenarionSurge4Lettuce:
		case CardIds.CenarionSurge5Lettuce:
			return nature;
		case CardIds.ChilledToTheBone5Lettuce:
			return freeze;
		case CardIds.ChromaticDragonflight1Lettuce:
		case CardIds.ChromaticDragonflight2Lettuce:
		case CardIds.ChromaticDragonflight3Lettuce:
		case CardIds.ChromaticDragonflight5Lettuce:
			return dragon;
		case CardIds.ChromaticInfusion1Lettuce:
		case CardIds.ChromaticInfusion2Lettuce:
		case CardIds.ChromaticInfusion3Lettuce:
		case CardIds.ChromaticInfusion4Lettuce:
		case CardIds.ChromaticInfusion5Lettuce:
			return dragon;
		case CardIds.Condemn5Lettuce:
			return holy;
		case CardIds.CorruptedPower5Lettuce:
			return and(merc, oldgod);
		case CardIds.CorruptionRunsDeep5Lettuce:
			return shadow;
		case CardIds.DarkShamanCowl1Lettuce:
		case CardIds.DarkShamanCowl2Lettuce:
		case CardIds.DarkShamanCowl3Lettuce:
		case CardIds.DarkShamanCowl4Lettuce:
		case CardIds.DarkShamanCowl5Lettuce:
			return horde;
		case CardIds.DeceivingFire5Lettuce:
			return pirate;
		case CardIds.DeepBreath1Lettuce:
		case CardIds.DeepBreath2Lettuce:
		case CardIds.DeepBreath3Lettuce:
		case CardIds.DeepBreath4Lettuce:
		case CardIds.DeepBreath5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.DelightfulDreamInfusion5Lettuce:
			return dragon;
		case CardIds.Demonfire5Lettuce:
			return demon;
		case CardIds.DemonSoul1Lettuce:
		case CardIds.DemonSoul2Lettuce:
		case CardIds.DemonSoul3Lettuce:
		case CardIds.DemonSoul5Lettuce:
			return and(fel, dealsDamage);
		case CardIds.DevotedWorshippers5Lettuce:
			return or(summon, oldgod);
		case CardIds.DiverDown5Lettuce:
			return naga;
		case CardIds.DownToBusiness5Lettuce:
			return fighter;
		case CardIds.ElementaryStudies5Lettuce:
			return or(human, elemental, and(fire, dealsDamage));
		case CardIds.ElunesOvergrowth5Lettuce:
			return nature;
		case CardIds.ElvenBanner5Lettuce:
			return or(bloodelf, highelf, nightelf);
		case CardIds.EmeraldBlessing5Lettuce:
			return dragon;
		case CardIds.EredarLord5Lettuce:
			return and(dealsDamage, fel);
		case CardIds.EssenceOfTheBlack5Lettuce:
			return or(and(dealsDamage, shadow), dragon);
		case CardIds.EverywhereWorgen5Lettuce:
			return human;
		case CardIds.ExtraTentacles5Lettuce:
			return (card: ReferenceCard) =>
				[
					CardIds.MindFlay1Lettuce,
					CardIds.MindFlay2Lettuce,
					CardIds.MindFlay3Lettuce,
					CardIds.MindFlay4Lettuce,
					CardIds.MindFlay5Lettuce,
				].includes(normalizeMercenariesCardId(card.id) as CardIds);
		case CardIds.EyeOfTheStorm5Lettuce:
			return nature;
		case CardIds.FamilyJustice5Lettuce:
		case CardIds.FamilyDefense5Lettuce:
			return (card: ReferenceCard) =>
				[CardIds.CarielRoameLettuce_LETL_020H_01, CardIds.CorneliusRoameLettuce_SWL_06H_01].includes(
					normalizeMercenariesCardId(card.id) as CardIds,
				);
		case CardIds.FateForeseen5Lettuce:
			return caster;
		case CardIds.FelBlast5Lettuce:
			return fel;
		case CardIds.FelBurst5Lettuce:
			return felSpellPower;
		case CardIds.FelCorruption1Lettuce:
		case CardIds.FelCorruption2Lettuce:
		case CardIds.FelCorruption3Lettuce:
		case CardIds.FelCorruption4Lettuce:
		case CardIds.FelCorruption5Lettuce:
			return orc;
		case CardIds.FelosophicalInsight5Lettuce:
			return and(fel, dealsDamage);
		case CardIds.FelRitual5Lettuce:
			return and(fel, dealsDamage);
		case CardIds.FelStaff5Lettuce:
			return fel;
		case CardIds.FelVolley5Lettuce:
			return fel;
		case CardIds.FireballVolley5Lettuce:
			return fire;
		case CardIds.FireBurst5Lettuce:
			return fireSpellPower;
		case CardIds.FireLance5Lettuce:
			return fire;
		case CardIds.FireRitual5Lettuce:
			return fire;
		case CardIds.FlameBuffet1Lettuce:
		case CardIds.FlameBuffet2Lettuce:
		case CardIds.FlameBuffet3Lettuce:
		case CardIds.FlameBuffet4Lettuce:
		case CardIds.FlameBuffet5Lettuce:
			return dragon;
		case CardIds.FireStaff5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.FireballVolley5Lettuce:
			return fire;
		case CardIds.FishyBarrage1Lettuce:
		case CardIds.FishyBarrage2Lettuce:
		case CardIds.FishyBarrage3Lettuce:
		case CardIds.FishyBarrage4Lettuce:
		case CardIds.FishyBarrage5Lettuce:
			return murloc;
		case CardIds.ForTheAlliance5Lettuce:
			return alliance;
		case CardIds.ForTheFin5Lettuce:
			return murloc;
		case CardIds.FrostBlast1Lettuce:
		case CardIds.FrostBlast2Lettuce:
		case CardIds.FrostBlast3Lettuce:
		case CardIds.FrostBlast4Lettuce:
		case CardIds.FrostBlast5Lettuce:
			return frost;
		case CardIds.FrostRitual5Lettuce:
			return and(frost, dealsDamage);
		case CardIds.FrostVolley5Lettuce:
			return frost;
		case CardIds.FrostStaff5Lettuce:
			return and(frost, dealsDamage);
		case CardIds.GiveInToYourRage5Lettuce:
		case CardIds.GiveInToYourRage2Lettuce:
			return oldgod;
		case CardIds.GodfreysArmy5Lettuce:
			return undead;
		case CardIds.GreenSavior5Lettuce:
			return orc;
		case CardIds.HellScream5Lettuce:
			return orc;
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
		case CardIds.HolyBurst5Lettuce:
			return holySpellPower;
		case CardIds.HolyJudgment1Lettuce:
		case CardIds.HolyJudgment2Lettuce:
		case CardIds.HolyJudgment3Lettuce:
		case CardIds.HolyJudgment4Lettuce:
		case CardIds.HolyJudgment5Lettuce:
			return and(holy, combo(refCard));
		case CardIds.HolyRitual5Lettuce:
			return and(holy, or(dealsDamage, restoresHealth));
		case CardIds.HolyShock5Lettuce:
			return holy;
		case CardIds.HolyStaff5Lettuce:
			return and(holy, dealsDamage);
		case CardIds.HolyWordSalvation1Lettuce:
		case CardIds.HolyWordSalvation2Lettuce:
		case CardIds.HolyWordSalvation3Lettuce:
		case CardIds.HolyWordSalvation4Lettuce:
		case CardIds.HolyWordSalvation5Lettuce:
			return human;
		case CardIds.HuntingParty5Lettuce:
			return beast;
		case CardIds.ImprovedXalatath5Lettuce:
			return shadow;
		case CardIds.InfernalCombustion5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.Inferno1Lettuce:
		case CardIds.Inferno2Lettuce:
		case CardIds.Inferno3Lettuce:
		case CardIds.Inferno4Lettuce:
		case CardIds.Inferno5Lettuce:
			return and(fire, combo(refCard));
		case CardIds.KittyRide5Lettuce:
			return or(dragon, beast);
		case CardIds.KnowledgeIsPower5Lettuce:
			return summon;
		case CardIds.LeagueRecruitmentFlyer5Lettuce:
			return explorer;
		case CardIds.LeechingPoison5Lettuce:
		case CardIds.LeechingPoison2Lettuce:
			return bleed;
		case CardIds.LegionSweep5Lettuce:
			return demon;
		case CardIds.LifebindersLocket5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.LightEater5Lettuce:
			return holy;
		case CardIds.LightningBolt1Lettuce:
		case CardIds.LightningBolt2Lettuce:
		case CardIds.LightningBolt3Lettuce:
		case CardIds.LightningBolt4Lettuce:
		case CardIds.LightningBolt5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.LivingBrambles1Lettuce:
		case CardIds.LivingBrambles2Lettuce:
		case CardIds.LivingBrambles3Lettuce:
		case CardIds.LivingBrambles4Lettuce:
		case CardIds.LivingBrambles5Lettuce:
			return and(nature, combo(refCard));
		case CardIds.MagicalMayhem5Lettuce:
		case CardIds.MagicalMayhem2Lettuce:
		case CardIds.MagicalMayhem3Lettuce:
			return anySpellPower;
		case CardIds.MagmaBlast1Lettuce:
		case CardIds.MagmaBlast2Lettuce:
		case CardIds.MagmaBlast3Lettuce:
		case CardIds.MagmaBlast4Lettuce:
		case CardIds.MagmaBlast5Lettuce:
			return and(fire, combo(refCard));
		case CardIds.Manastorm5Lettuce:
			return and(arcane, dealsDamage);
		case CardIds.MandateOfAugust5Lettuce:
			return or(dragon, beast);
		case CardIds.MarkOfTheViper5Lettuce:
			return or(nightelf, beast);
		case CardIds.MulgoreMight1Lettuce:
		case CardIds.MulgoreMight2Lettuce:
		case CardIds.MulgoreMight3Lettuce:
		case CardIds.MulgoreMight4Lettuce:
		case CardIds.MulgoreMight5Lettuce:
			return and(nature, combo(refCard));
		case CardIds.MurkysLuckyFish5Lettuce:
			return and(murloc, merc);
		case CardIds.MurlocInfestation5Lettuce:
			return and(murloc, merc);
		case CardIds.MurlocScrabble5Lettuce:
			return or(taunt, divineShield);
		case CardIds.MurkyMastery5Lettuce:
			return murloc;
		case CardIds.NatureBlast5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.NatureBurst5Lettuce:
			return natureSpellPower;
		case CardIds.NatureRitual5Lettuce:
			return nature;
		case CardIds.NaturesBite5Lettuce:
			return nature;
		case CardIds.NatureStaff5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.NegativeEquilibrium5Lettuce:
			return or(beast, dragon, restoresHealth);
		case CardIds.NephriteArmy5Lettuce:
			return or(dragon, and(dealsDamage, nature));
		case CardIds.OneWithShadows5Lettuce:
			return stealth;
		case CardIds.OrcOnslaught1Lettuce:
		case CardIds.OrcOnslaught2Lettuce:
		case CardIds.OrcOnslaught3Lettuce:
		case CardIds.OrcOnslaught4Lettuce:
		case CardIds.OrcOnslaught5Lettuce:
			return orc;
		case CardIds.OrgrimmarTabard5Lettuce:
			return orc;
		case CardIds.PackedSnow5Lettuce:
			return frost;
		case CardIds.PositiveEquilibrium5Lettuce:
			return or(and(dealsDamage, nature), and(dealsDamage, fire), beast, dragon);
		case CardIds.PunishedHellscream5Lettuce:
			return orc;
		case CardIds.RaceToTheFeast5Lettuce:
			return or(beast, dragon);
		case CardIds.Regeneratin5Lettuce:
			return troll;
		case CardIds.RevealedInMoonlight5Lettuce:
			return or(nightelf, tauren, troll);
		case CardIds.RodOfTheArchmage5Lettuce:
			return and(fire, dealsDamage);
		case CardIds.SafetyBubble5Lettuce:
			return murloc;
		case CardIds.Scorch5Lettuce:
			return elemental;
		case CardIds.SearingStrike1Lettuce:
		case CardIds.SearingStrike2Lettuce:
		case CardIds.SearingStrike3Lettuce:
		case CardIds.SearingStrike4Lettuce:
		case CardIds.SearingStrike5Lettuce:
			return fire;
		case CardIds.SecretOfTheNaga5Lettuce:
			return naga;
		case CardIds.ShadowBurst5Lettuce:
			return shadowSpellPower;
		case CardIds.Shadowflame1Lettuce_LT22_011P3_01:
		case CardIds.Shadowflame2Lettuce_LT22_011P3_02:
		case CardIds.Shadowflame3Lettuce_LT22_011P3_03:
		case CardIds.Shadowflame4Lettuce_LT22_011P3_04:
		case CardIds.Shadowflame5Lettuce_LT22_011P3_05:
			return dragon;
		case CardIds.ShadowLance5Lettuce:
			return shadow;
		case CardIds.ShadowRitual5Lettuce:
			return shadow;
		case CardIds.ShadowStaff5Lettuce:
			return and(shadow, dealsDamage);
		case CardIds.ShadowSurge1Lettuce:
		case CardIds.ShadowSurge2Lettuce:
		case CardIds.ShadowSurge3Lettuce:
		case CardIds.ShadowSurge4Lettuce:
		case CardIds.ShadowSurge5Lettuce:
			return and(shadow, combo(refCard));
		case CardIds.ShadowVolley5Lettuce:
			return shadow;
		case CardIds.ShoutOfTheUnforgiven5Lettuce:
			return orc;
		case CardIds.SicSemperTyrannosaurus5Lettuce:
			return beast;
		case CardIds.SnapFreeze5Lettuce:
			return freeze;
		case CardIds.SpareParts1Lettuce:
		case CardIds.SpareParts2Lettuce:
		case CardIds.SpareParts3Lettuce:
		case CardIds.SpareParts5Lettuce:
			return dragon;
		case CardIds.SpiritOfTheDeadEr5Lettuce:
			return troll;
		case CardIds.SplittingStrike1Lettuce:
		case CardIds.SplittingStrike2Lettuce:
		case CardIds.SplittingStrike3Lettuce:
		case CardIds.SplittingStrike4Lettuce:
		case CardIds.SplittingStrike5Lettuce:
			return human;
		case CardIds.SproutingTentacles5Lettuce:
			return and(or(merc, minion), not(oldgod));
		case CardIds.StaffOfJordan5Lettuce:
			return restoresHealth;
		case CardIds.SteadfastShield5Lettuce:
			return taunt;
		case CardIds.StonehearthSalvation5Lettuce:
			return or(fire, frost);
		case CardIds.StormwindTabard5Lettuce:
			return human;
		case CardIds.StrengthOfTheElements5Lettuce:
			return elemental;
		case CardIds.StrengthOfTheOx5Lettuce:
			return (card: ReferenceCard) =>
				[
					CardIds.BullishFortitude1Lettuce,
					CardIds.BullishFortitude2Lettuce,
					CardIds.BullishFortitude3Lettuce,
					CardIds.BullishFortitude4Lettuce,
					CardIds.BullishFortitude5Lettuce,
				].includes(normalizeMercenariesCardId(card.id) as CardIds);
		case CardIds.StrengthOfWrynn5Lettuce:
			return or(human, and(holy, dealsDamage));
		case CardIds.SurvivalTraining5Lettuce:
			return beast;
		case CardIds.TeamworkIsDreamWork5Lettuce:
			return explorer;
		case CardIds.TempestsFury5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.TheAllConsumingVoid5Lettuce:
			return shadow;
		case CardIds.TheBeastWithin5Lettuce:
			return beast;
		case CardIds.TheFinHeadedLeague5Lettuce:
			return murloc;
		case CardIds.TidalStrike1Lettuce:
		case CardIds.TidalStrike2Lettuce:
		case CardIds.TidalStrike3Lettuce:
		case CardIds.TidalStrike4Lettuce:
		case CardIds.TidalStrike5Lettuce:
			return and(frost, combo(refCard));
		case CardIds.TirisfalenTriumph5Lettuce:
			return caster;
		case CardIds.ToxicVenom1Lettuce:
		case CardIds.ToxicVenom2Lettuce:
		case CardIds.ToxicVenom3Lettuce:
		case CardIds.ToxicVenom5Lettuce:
			return nature;
		case CardIds.TreasureChest5Lettuce:
			return pirate;
		case CardIds.TribalWarfare1Lettuce:
		case CardIds.TribalWarfare2Lettuce:
		case CardIds.TribalWarfare3Lettuce:
		case CardIds.TribalWarfare4Lettuce:
		case CardIds.TribalWarfare5Lettuce:
			return orc;
		case CardIds.UndeathToUnlife5Lettuce:
			return undead;
		case CardIds.VelensBlessing1Lettuce:
		case CardIds.VelensBlessing2Lettuce:
		case CardIds.VelensBlessing3Lettuce:
		case CardIds.VelensBlessing4Lettuce:
		case CardIds.VelensBlessing5Lettuce:
			return holy;
		case CardIds.VolleyOfLight5Lettuce:
			return holy;
		case CardIds.WarchiefsBlessing5Lettuce:
			return horde;
		case CardIds.YourMotherWasAMurloc5Lettuce:
			return taunt;
		case CardIds.ZhardoomGreatstaffOfTheDevourer5Lettuce:
			return or(and(shadow, dealsDamage), and(fel, dealsDamage));
	}
};

const and = (...selectors: HighlightSelector[]): HighlightSelector => {
	return (card: ReferenceCard) => selectors.every((selector) => selector(card));
};

const or = (...selectors: HighlightSelector[]): HighlightSelector => {
	return (card: ReferenceCard) => selectors.some((selector) => selector(card));
};

const not = (selector: HighlightSelector): HighlightSelector => {
	return (card: ReferenceCard) => !selector(card);
};

const combo = (second: ReferenceCard): HighlightSelector => {
	return (first: ReferenceCard) => first?.cost <= second?.cost;
};

const hasMechanic = (card: ReferenceCard, mechanic: GameTag) => (card?.mechanics ?? []).includes(GameTag[mechanic]);
const hasReferencedTag = (card: ReferenceCard, tag: GameTag) => (card?.referencedTags ?? []).includes(GameTag[tag]);
const hasTag = (card: ReferenceCard, tag: GameTag) => (card?.tags ?? []).includes(GameTag[tag]);

const merc = (card: ReferenceCard) => card.mercenary;
const minion = (card: ReferenceCard) => !!card.races?.length && !card.mercenary;
const race = (card: ReferenceCard, race: Race) => card.races?.includes(Race[race]);
const beast = (card: ReferenceCard) => race(card, Race.BEAST);
const bloodelf = (card: ReferenceCard) => race(card, Race.BLOODELF);
const celestial = (card: ReferenceCard) => race(card, Race.CELESTIAL);
const demon = (card: ReferenceCard) => race(card, Race.DEMON);
const draenei = (card: ReferenceCard) => race(card, Race.DRAENEI);
const dragon = (card: ReferenceCard) => race(card, Race.DRAGON);
const dwarf = (card: ReferenceCard) => race(card, Race.DWARF);
const elemental = (card: ReferenceCard) => race(card, Race.ELEMENTAL);
const gnome = (card: ReferenceCard) => race(card, Race.GNOME);
const goblin = (card: ReferenceCard) => race(card, Race.GOBLIN);
const halforc = (card: ReferenceCard) => race(card, Race.HALFORC);
const highelf = (card: ReferenceCard) => race(card, Race.HIGHELF);
const human = (card: ReferenceCard) => race(card, Race.HUMAN);
const murloc = (card: ReferenceCard) => race(card, Race.MURLOC);
const naga = (card: ReferenceCard) => race(card, Race.NAGA);
const nightelf = (card: ReferenceCard) => race(card, Race.NIGHTELF);
const pirate = (card: ReferenceCard) => race(card, Race.PIRATE);
const orc = (card: ReferenceCard) => race(card, Race.ORC);
const oldgod = (card: ReferenceCard) => race(card, Race.OLDGOD);
const tauren = (card: ReferenceCard) => race(card, Race.TAUREN);
const troll = (card: ReferenceCard) => race(card, Race.TROLL);
const undead = (card: ReferenceCard) => race(card, Race.UNDEAD);
const worgen = (card: ReferenceCard) => race(card, Race.WORGEN);

const hasRole = (card: ReferenceCard, role: TagRole) => card.mercenaryRole === TagRole[role];
const caster = (card: ReferenceCard) => hasRole(card, TagRole.CASTER);
const fighter = (card: ReferenceCard) => hasRole(card, TagRole.FIGHTER);
const protector = (card: ReferenceCard) => hasRole(card, TagRole.TANK);

const alliance = or(draenei, dwarf, gnome, highelf, human, nightelf, worgen);
const horde = or(bloodelf, goblin, halforc, orc, tauren, troll, undead);
const explorer = (card: ReferenceCard) => hasTag(card, GameTag.MERCS_EXPLORER);

const spellSchool = (card: ReferenceCard, spellSchool: SpellSchool) =>
	SpellSchool[spellSchool] === card.spellSchool?.toUpperCase();
const arcane = (card: ReferenceCard) => spellSchool(card, SpellSchool.ARCANE);
const fire = (card: ReferenceCard) => spellSchool(card, SpellSchool.FIRE);
const holy = (card: ReferenceCard) => spellSchool(card, SpellSchool.HOLY);
const nature = (card: ReferenceCard) => spellSchool(card, SpellSchool.NATURE);
const frost = (card: ReferenceCard) => spellSchool(card, SpellSchool.FROST);
const fel = (card: ReferenceCard) => spellSchool(card, SpellSchool.FEL);
const shadow = (card: ReferenceCard) => spellSchool(card, SpellSchool.SHADOW);

const arcaneSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_ARCANE);
const felSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_FEL);
const fireSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_FIRE);
const frostSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_FROST);
const holySpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_HOLY);
const natureSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_NATURE);
const shadowSpellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER_SHADOW);
const spellPower = (card: ReferenceCard) => hasReferencedTag(card, GameTag.SPELLPOWER);
const anySpellPower = or(
	arcaneSpellPower,
	felSpellPower,
	fireSpellPower,
	frostSpellPower,
	holySpellPower,
	natureSpellPower,
	shadowSpellPower,
	spellPower,
);

const bleed = (card: ReferenceCard) => hasMechanic(card, GameTag.BLEED);
const deathrattle = (card: ReferenceCard) => hasMechanic(card, GameTag.DEATHRATTLE);
const divineShield = (card: ReferenceCard) => hasMechanic(card, GameTag.DIVINE_SHIELD);
const freeze = (card: ReferenceCard) => hasMechanic(card, GameTag.FREEZE);
const stealth = (card: ReferenceCard) => hasMechanic(card, GameTag.STEALTH);
const summon = (card: ReferenceCard) => hasMechanic(card, GameTag.SUMMON);
const taunt = (card: ReferenceCard) => hasMechanic(card, GameTag.TAUNT);

const isAbility = (card: ReferenceCard) => !card.mercenary && !card.mercenaryEquipment;
const speedIsOdd = (card: ReferenceCard) => isAbility(card) && card.cost % 2 === 1;
const speedIsEven = (card: ReferenceCard) => isAbility(card) && card.cost % 2 === 0;

const dealsDamage = (card: ReferenceCard) => card.mechanics?.includes('DEAL_DAMAGE');
const restoresHealth = (card: ReferenceCard) => card.mechanics?.includes('RESTORE_HEALTH');
