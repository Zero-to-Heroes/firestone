/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const VictorNefarius: StaticGeneratingCard = {
	cardIds: [CardIds.VictorNefarius_CATA_470],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => [
		CardIds.TimeTwistedSeer_END_022, // Dragon - Time-Twisted Seer (1)
		CardIds.FaerieDragonCore, // Dragon - Faerie Dragon (2)
		CardIds.FaeTrickster_EDR_571, // Dragon - Fae Trickster (3)
		CardIds.WhelpOfTheBronze_TIME_056, // Dragon - Whelp of the Bronze (3)
		CardIds.WhelpOfTheInfinite_TIME_045, // Dragon - Whelp of the Infinite (3)
		CardIds.Razorscale, // Dragon - Razorscale (3)
		CardIds.ScaledLancer_CATA_898, // Dragon - Scaled Lancer (4)
		CardIds.Squallhunter, // Dragon - Squallhunter (4)
		CardIds.TwilightDrakeCore, // Dragon - Twilight Drake (4)
		CardIds.IncensedMatriarch_CATA_305, // Dragon - Incensed Matriarch (4)
		CardIds.SoldierOfTheBronze_TIME_720, // Dragon - Soldier of the Bronze (5)
		CardIds.AlgetharInstructor_TIME_856, // Dragon - Algeth'ar Instructor (5)
		CardIds.DragonmawScorcher, // Dragon - Dragonmaw Scorcher (5)
		CardIds.SoldierOfTheInfinite_TIME_051, // Dragon - Soldier of the Infinite (5)
		CardIds.VolcanicDrake_BRM_025, // Dragon - Volcanic Drake (6)
		CardIds.StoneDrake_DEEP_006, // Dragon - Stone Drake (6)
		CardIds.MechanicalWhelp, // Dragon - Mechanical Whelp (6)
		CardIds.DrakeadonMongrel_CATA_723, // Dragon - Drakeadon Mongrel (7)
		CardIds.PlaguedProtodrake, // Dragon - Plagued Protodrake (8)
		CardIds.SkeletalSidekickCore_RLK_958, // Undead - Skeletal Sidekick (1)
		CardIds.BodyBaggerCore_RLK_503, // Undead - Body Bagger (1)
		CardIds.DevourerOfSouls_RLK_538, // Undead - Devourer of Souls (1)
		CardIds.WildPyromancerCore, // Undead - Wild Pyromancer (2)
		CardIds.DarkPeddler_CORE_WON_096, // Undead - Dark Peddler (2)
		CardIds.TaintedZealot_ICC_913, // Undead - Tainted Zealot (2)
		CardIds.HarbingerOfWinterCore_RLK_511, // Undead - Harbinger of Winter (2)
		CardIds.BloodmageThalnosCore, // Undead - Bloodmage Thalnos (2)
		CardIds.TempleBerserker, // Undead - Temple Berserker (2)
		CardIds.OneHitWonder, // Undead - One Hit Wonder (2)
		CardIds.HappyGhoul_ICC_700, // Undead - Happy Ghoul (3)
		CardIds.RavagingGhoul_CORE_OG_149, // Undead - Ravaging Ghoul (3)
		CardIds.ShadeOfTheEndTime_END_031, // Undead - Shade of the End Time (3)
		CardIds.Candletaker_ULD_205, // Undead - Candletaker (3)
		CardIds.Chronochiller_TIME_617, // Undead - Chronochiller (4)
		CardIds.BoneWraith_ULD_275, // Undead - Bone Wraith (4)
		CardIds.CoolGhoul, // Undead - Cool Ghoul (4)
		CardIds.ChillbladeChampion_ICC_820, // Undead - Chillblade Champion (4)
		CardIds.PlaguedProtodrake, // Dragon - Plagued Protodrake (8)
	],
};
