import { CardIds, GameTag, Race, ReferenceCard, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '../../cards-facade.service';
import { normalizeMercenariesCardId } from '../mercenaries-utils';
import { HighlightSelector } from './mercenaries-synergies-highlight.service';

export const buildSelector = (cardId: string, allCards: CardsFacadeService): HighlightSelector => {
	const refCard = allCards.getCard(cardId);

	switch (cardId) {
		case CardIds.AllianceWarBanner1Lettuce:
		case CardIds.AllianceWarBanner2Lettuce:
		case CardIds.AllianceWarBanner3Lettuce:
		case CardIds.AllianceWarBanner4Lettuce:
		case CardIds.AllianceWarBanner5Lettuce:
			return alliance;
		case CardIds.AlunethLettuce:
			return and(dealsDamage, arcane);
		case CardIds.ArcaneBlast1Lettuce:
		case CardIds.ArcaneBlast2Lettuce:
		case CardIds.ArcaneBlast3Lettuce:
		case CardIds.ArcaneBlast4Lettuce:
		case CardIds.ArcaneBlast5Lettuce:
			return arcaneSpellPower;
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
		case CardIds.ArcaneVolley1Lettuce:
		case CardIds.ArcaneVolley2Lettuce:
		case CardIds.ArcaneVolley3Lettuce:
		case CardIds.ArcaneVolley4Lettuce:
		case CardIds.ArcaneVolley5Lettuce:
			return arcane;
		case CardIds.AtieshLettuce:
			return and(dealsDamage, or(fire, frost));
		case CardIds.AvatarOfStormpike1Lettuce:
		case CardIds.AvatarOfStormpike2Lettuce:
		case CardIds.AvatarOfStormpike3Lettuce:
		case CardIds.AvatarOfStormpike4Lettuce:
			return dwarf;
		case CardIds.AzsharanInfluence1Lettuce:
		case CardIds.AzsharanInfluence2Lettuce:
		case CardIds.AzsharanInfluence3Lettuce:
		case CardIds.AzsharanInfluence4Lettuce:
		case CardIds.AzsharanInfluence5Lettuce:
			return or(dealsDamage, naga);
		case CardIds.BakuTheMooneater1Lettuce:
		case CardIds.BakuTheMooneater2Lettuce:
		case CardIds.BakuTheMooneater3Lettuce:
		case CardIds.BakuTheMooneater4Lettuce:
		case CardIds.BakuTheMooneater5Lettuce:
			return speedIsOdd;
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
		case CardIds.BirdBuddy1Lettuce_LT24_008T2_01:
		case CardIds.BirdBuddy2Lettuce_LT24_008T2_02:
		case CardIds.BirdBuddy3Lettuce_LT24_008T2_03:
		case CardIds.BirdBuddy4Lettuce_LT24_008T2_04:
		case CardIds.BirdBuddy5Lettuce_LT24_008T2_05:
			return speedIsEven;
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
		case CardIds.BoonOfAtiesh2Lettuce:
		case CardIds.BoonOfAtiesh3Lettuce:
		case CardIds.BoonOfAtiesh4Lettuce:
			return and(dealsDamage, or(fire, frost, arcane));
		case CardIds.BrilliantAmity1Lettuce:
		case CardIds.BrilliantAmity2Lettuce:
		case CardIds.BrilliantAmity3Lettuce:
		case CardIds.BrilliantAmity4Lettuce:
		case CardIds.BrilliantAmity5Lettuce:
			return taunt;
		case CardIds.BurningLegionTabard1Lettuce:
		case CardIds.BurningLegionTabard2Lettuce:
		case CardIds.BurningLegionTabard3Lettuce:
		case CardIds.BurningLegionTabard4Lettuce:
		case CardIds.BurningLegionTabard5Lettuce:
			return demon;
		case CardIds.CantTouchThis1Lettuce:
		case CardIds.CantTouchThis2Lettuce:
		case CardIds.CantTouchThis3Lettuce:
		case CardIds.CantTouchThis4Lettuce:
		case CardIds.CantTouchThis5Lettuce:
			return taunt;
		case CardIds.CenarionSurge1Lettuce:
		case CardIds.CenarionSurge2Lettuce:
		case CardIds.CenarionSurge3Lettuce:
		case CardIds.CenarionSurge4Lettuce:
		case CardIds.CenarionSurge5Lettuce:
			return nature;
		case CardIds.ChilledToTheBone1Lettuce:
		case CardIds.ChilledToTheBone2Lettuce:
		case CardIds.ChilledToTheBone3Lettuce:
		case CardIds.ChilledToTheBone4Lettuce:
		case CardIds.ChilledToTheBone5Lettuce:
			return freeze;
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
		case CardIds.CorruptedPower1Lettuce:
		case CardIds.CorruptedPower2Lettuce:
		case CardIds.CorruptedPower3Lettuce:
		case CardIds.CorruptedPower4Lettuce:
		case CardIds.CorruptedPower5Lettuce:
			return and(merc, oldgod);
		case CardIds.CorruptionRunsDeep1Lettuce:
		case CardIds.CorruptionRunsDeep2Lettuce:
		case CardIds.CorruptionRunsDeep3Lettuce:
		case CardIds.CorruptionRunsDeep4Lettuce:
		case CardIds.CorruptionRunsDeep5Lettuce:
			return shadow;
		case CardIds.DarkShamanCowl1Lettuce:
		case CardIds.DarkShamanCowl2Lettuce:
		case CardIds.DarkShamanCowl3Lettuce:
		case CardIds.DarkShamanCowl4Lettuce:
		case CardIds.DarkShamanCowl5Lettuce:
			return horde;
		case CardIds.DeceivingFire1Lettuce:
		case CardIds.DeceivingFire2Lettuce:
		case CardIds.DeceivingFire3Lettuce:
		case CardIds.DeceivingFire4Lettuce:
		case CardIds.DeceivingFire5Lettuce:
			return pirate;
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
			return or(bloodelf, highelf, nightelf);
		case CardIds.EmeraldBlessing1Lettuce:
		case CardIds.EmeraldBlessing2Lettuce:
		case CardIds.EmeraldBlessing3Lettuce:
		case CardIds.EmeraldBlessing4Lettuce:
		case CardIds.EmeraldBlessing5Lettuce:
			return dragon;
		case CardIds.EssenceOfTheBlack1Lettuce:
		case CardIds.EssenceOfTheBlack2Lettuce:
		case CardIds.EssenceOfTheBlack3Lettuce:
		case CardIds.EssenceOfTheBlack4Lettuce:
		case CardIds.EssenceOfTheBlack5Lettuce:
			return or(and(dealsDamage, shadow), dragon);
		case CardIds.EverywhereWorgen1Lettuce:
		case CardIds.EverywhereWorgen2Lettuce:
		case CardIds.EverywhereWorgen3Lettuce:
		case CardIds.EverywhereWorgen4Lettuce:
		case CardIds.EverywhereWorgen5Lettuce:
			return human;
		case CardIds.ExtraTentacles1Lettuce:
			return (card: ReferenceCard) =>
				[
					CardIds.MindFlay1Lettuce,
					CardIds.MindFlay2Lettuce,
					CardIds.MindFlay3Lettuce,
					CardIds.MindFlay4Lettuce,
					CardIds.MindFlay5Lettuce,
				].includes(normalizeMercenariesCardId(card.id) as CardIds);
		case CardIds.FamilyJusticeLettuce:
		case CardIds.FamilyDefenseLettuce:
			return (card: ReferenceCard) =>
				[CardIds.CarielRoameLettuce_LETL_020H_01, CardIds.CorneliusRoameLettuce_SWL_06H_01].includes(
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
		case CardIds.FelosophicalInsight1Lettuce:
		case CardIds.FelosophicalInsight2Lettuce:
		case CardIds.FelosophicalInsight3Lettuce:
			return and(fel, dealsDamage);
		case CardIds.FelRitual1Lettuce:
		case CardIds.FelRitual2Lettuce:
		case CardIds.FelRitual3Lettuce:
		case CardIds.FelRitual4Lettuce:
		case CardIds.FelRitual5Lettuce:
			return and(fel, dealsDamage);
		case CardIds.FelStaff1Lettuce:
		case CardIds.FelStaff2Lettuce:
		case CardIds.FelStaff3Lettuce:
		case CardIds.FelStaff4Lettuce:
		case CardIds.FelStaff5Lettuce:
			return fel;
		case CardIds.FelVolley1Lettuce:
		case CardIds.FelVolley2Lettuce:
		case CardIds.FelVolley3Lettuce:
		case CardIds.FelVolley4Lettuce:
		case CardIds.FelVolley5Lettuce:
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
		case CardIds.FireballVolley1Lettuce:
		case CardIds.FireballVolley2Lettuce:
		case CardIds.FireballVolley3Lettuce:
		case CardIds.FireballVolley4Lettuce:
		case CardIds.FireballVolley5Lettuce:
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
		case CardIds.GiveInToYourRage1Lettuce:
		case CardIds.GiveInToYourRage2Lettuce:
			return oldgod;
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
		case CardIds.HolyJudgment1Lettuce:
		case CardIds.HolyJudgment2Lettuce:
		case CardIds.HolyJudgment3Lettuce:
		case CardIds.HolyJudgment4Lettuce:
		case CardIds.HolyJudgment5Lettuce:
			return and(holy, combo(refCard));
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
			return and(fire, combo(refCard));
		case CardIds.KittyRideLettuce:
			return or(dragon, beast);
		case CardIds.LeagueRecruitmentFlyer1Lettuce:
		case CardIds.LeagueRecruitmentFlyer2Lettuce:
		case CardIds.LeagueRecruitmentFlyer3Lettuce:
		case CardIds.LeagueRecruitmentFlyer4Lettuce:
		case CardIds.LeagueRecruitmentFlyer5Lettuce:
			return explorer;
		case CardIds.LeechingPoison1Lettuce:
		case CardIds.LeechingPoison2Lettuce:
			return bleed;
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
		case CardIds.LivingBrambles1Lettuce:
		case CardIds.LivingBrambles2Lettuce:
		case CardIds.LivingBrambles3Lettuce:
		case CardIds.LivingBrambles4Lettuce:
		case CardIds.LivingBrambles5Lettuce:
			return and(nature, combo(refCard));
		case CardIds.MagicalMayhem1Lettuce:
		case CardIds.MagicalMayhem2Lettuce:
		case CardIds.MagicalMayhem3Lettuce:
			return anySpellPower;
		case CardIds.MagmaBlast1Lettuce:
		case CardIds.MagmaBlast2Lettuce:
		case CardIds.MagmaBlast3Lettuce:
		case CardIds.MagmaBlast4Lettuce:
		case CardIds.MagmaBlast5Lettuce:
			return and(fire, combo(refCard));
		case CardIds.Manastorm1Lettuce:
		case CardIds.Manastorm2Lettuce:
		case CardIds.Manastorm3Lettuce:
		case CardIds.Manastorm4Lettuce:
		case CardIds.Manastorm5Lettuce:
			return and(arcane, dealsDamage);
		case CardIds.MandateOfAugust1Lettuce:
		case CardIds.MandateOfAugust2Lettuce:
		case CardIds.MandateOfAugust3Lettuce:
		case CardIds.MandateOfAugust4Lettuce:
		case CardIds.MandateOfAugust5Lettuce:
			return or(dragon, beast);
		case CardIds.MarkOfTheViper1Lettuce:
		case CardIds.MarkOfTheViper2Lettuce:
		case CardIds.MarkOfTheViper3Lettuce:
		case CardIds.MarkOfTheViper4Lettuce:
		case CardIds.MarkOfTheViper5Lettuce:
			return or(nightelf, beast);
		case CardIds.MulgoreMight1Lettuce:
		case CardIds.MulgoreMight2Lettuce:
		case CardIds.MulgoreMight3Lettuce:
		case CardIds.MulgoreMight4Lettuce:
		case CardIds.MulgoreMight5Lettuce:
			return and(nature, combo(refCard));
		case CardIds.MurkysLuckyFish1Lettuce:
		case CardIds.MurkysLuckyFish2Lettuce:
		case CardIds.MurkysLuckyFish3Lettuce:
		case CardIds.MurkysLuckyFish4Lettuce:
		case CardIds.MurkysLuckyFish5Lettuce:
			return and(murloc, merc);
		case CardIds.MurlocInfestation1Lettuce:
		case CardIds.MurlocInfestation2Lettuce:
		case CardIds.MurlocInfestation3Lettuce:
		case CardIds.MurlocInfestation4Lettuce:
		case CardIds.MurlocInfestation5Lettuce:
			return and(murloc, merc);
		case CardIds.MurlocScrabble1Lettuce:
		case CardIds.MurlocScrabble2Lettuce:
		case CardIds.MurlocScrabble3Lettuce:
		case CardIds.MurlocScrabble4Lettuce:
		case CardIds.MurlocScrabble5Lettuce:
			return or(taunt, divineShield);

		case CardIds.NatureBlast1Lettuce:
		case CardIds.NatureBlast2Lettuce:
		case CardIds.NatureBlast3Lettuce:
		case CardIds.NatureBlast4Lettuce:
		case CardIds.NatureBlast5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.NaturesBite1Lettuce:
		case CardIds.NaturesBite2Lettuce:
		case CardIds.NaturesBite3Lettuce:
		case CardIds.NaturesBite4Lettuce:
		case CardIds.NaturesBite5Lettuce:
			return nature;
		case CardIds.NatureStaff1Lettuce:
		case CardIds.NatureStaff2Lettuce:
		case CardIds.NatureStaff3Lettuce:
		case CardIds.NatureStaff4Lettuce:
		case CardIds.NatureStaff5Lettuce:
			return and(nature, dealsDamage);
		case CardIds.NegativeEquilibrium1Lettuce:
		case CardIds.NegativeEquilibrium2Lettuce:
		case CardIds.NegativeEquilibrium3Lettuce:
		case CardIds.NegativeEquilibrium4Lettuce:
		case CardIds.NegativeEquilibrium5Lettuce:
			return or(beast, dragon, restoresHealth);
		case CardIds.NephriteArmy1Lettuce:
		case CardIds.NephriteArmy2Lettuce:
			return or(dragon, and(dealsDamage, nature));
		case CardIds.OneWithShadowsLettuce:
			return stealth;
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
		case CardIds.PositiveEquilibrium1Lettuce:
		case CardIds.PositiveEquilibrium2Lettuce:
		case CardIds.PositiveEquilibrium3Lettuce:
		case CardIds.PositiveEquilibrium4Lettuce:
		case CardIds.PositiveEquilibrium5Lettuce:
			return or(and(dealsDamage, nature), and(dealsDamage, fire), beast, dragon);
		case CardIds.RaceToTheFeast1Lettuce:
		case CardIds.RaceToTheFeast2Lettuce:
		case CardIds.RaceToTheFeast3Lettuce:
		case CardIds.RaceToTheFeast4Lettuce:
		case CardIds.RaceToTheFeast5Lettuce:
			return or(beast, dragon);
		case CardIds.RodOfTheArchmageLettuce:
			return and(fire, dealsDamage);
		case CardIds.SafetyBubbleLettuce:
			return murloc;
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
		case CardIds.SecretOfTheNaga1Lettuce:
		case CardIds.SecretOfTheNaga2Lettuce:
		case CardIds.SecretOfTheNaga3Lettuce:
		case CardIds.SecretOfTheNaga4Lettuce:
			return naga;
		case CardIds.Shadowflame1Lettuce_LT22_011P3_01:
		case CardIds.Shadowflame2Lettuce_LT22_011P3_02:
		case CardIds.Shadowflame3Lettuce_LT22_011P3_03:
		case CardIds.Shadowflame4Lettuce_LT22_011P3_04:
		case CardIds.Shadowflame5Lettuce_LT22_011P3_05:
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
		case CardIds.ShadowSurge1Lettuce:
		case CardIds.ShadowSurge2Lettuce:
		case CardIds.ShadowSurge3Lettuce:
		case CardIds.ShadowSurge4Lettuce:
		case CardIds.ShadowSurge5Lettuce:
			return and(shadow, combo(refCard));
		case CardIds.ShadowVolley1Lettuce:
		case CardIds.ShadowVolley2Lettuce:
		case CardIds.ShadowVolley3Lettuce:
		case CardIds.ShadowVolley4Lettuce:
		case CardIds.ShadowVolley5Lettuce:
			return shadow;
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
		case CardIds.SproutingTentacles1Lettuce:
		case CardIds.SproutingTentacles2Lettuce:
		case CardIds.SproutingTentacles3Lettuce:
		case CardIds.SproutingTentacles4Lettuce:
		case CardIds.SproutingTentacles5Lettuce:
			return and(or(merc, minion), not(oldgod));
		case CardIds.StaffOfJordan1Lettuce:
		case CardIds.StaffOfJordan2Lettuce:
		case CardIds.StaffOfJordan3Lettuce:
		case CardIds.StaffOfJordan4Lettuce:
		case CardIds.StaffOfJordan5Lettuce:
			return restoresHealth;
		case CardIds.SteadfastShield1Lettuce:
		case CardIds.SteadfastShield2Lettuce:
		case CardIds.SteadfastShield3Lettuce:
		case CardIds.SteadfastShield4Lettuce:
		case CardIds.SteadfastShield5Lettuce:
			return taunt;
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
		case CardIds.StrengthOfTheOxLettuce:
			return (card: ReferenceCard) =>
				[
					CardIds.BullishFortitude1Lettuce,
					CardIds.BullishFortitude2Lettuce,
					CardIds.BullishFortitude3Lettuce,
					CardIds.BullishFortitude4Lettuce,
					CardIds.BullishFortitude5Lettuce,
				].includes(normalizeMercenariesCardId(card.id) as CardIds);
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
		case CardIds.TidalStrike1Lettuce:
		case CardIds.TidalStrike2Lettuce:
		case CardIds.TidalStrike3Lettuce:
		case CardIds.TidalStrike4Lettuce:
		case CardIds.TidalStrike5Lettuce:
			return and(frost, combo(refCard));
		case CardIds.ToxicVenom1Lettuce:
		case CardIds.ToxicVenom2Lettuce:
		case CardIds.ToxicVenom3Lettuce:
		case CardIds.ToxicVenom4Lettuce:
			return nature;
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
		case CardIds.VolleyOfLight1Lettuce:
		case CardIds.VolleyOfLight2Lettuce:
		case CardIds.VolleyOfLight3Lettuce:
		case CardIds.VolleyOfLight4Lettuce:
		case CardIds.VolleyOfLight5Lettuce:
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
const divineShield = (card: ReferenceCard) => hasMechanic(card, GameTag.DIVINE_SHIELD);
const freeze = (card: ReferenceCard) => hasMechanic(card, GameTag.FREEZE);
const stealth = (card: ReferenceCard) => hasMechanic(card, GameTag.STEALTH);
const taunt = (card: ReferenceCard) => hasMechanic(card, GameTag.TAUNT);

const isAbility = (card: ReferenceCard) => !card.mercenary && !card.mercenaryEquipment;
const speedIsOdd = (card: ReferenceCard) => isAbility(card) && card.cost % 2 === 1;
const speedIsEven = (card: ReferenceCard) => isAbility(card) && card.cost % 2 === 0;

const dealsDamage = (card: ReferenceCard) => card.mechanics?.includes('DEAL_DAMAGE');
const restoresHealth = (card: ReferenceCard) => card.mechanics?.includes('RESTORE_HEALTH');
