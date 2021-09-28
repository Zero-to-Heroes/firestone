import { TagRole } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '../cards-facade.service';

export const normalizeMercenariesHeroCardId = (
	heroCardId: string,
	fullNormalize = false,
	allCards: CardsFacadeService = null,
): string => {
	if (!heroCardId) {
		return heroCardId;
	}
	return heroCardId;
};

export const getHeroRole = (roleFromEnum: string): 'caster' | 'fighter' | 'protector' => {
	switch (roleFromEnum) {
		case TagRole[TagRole.CASTER]:
			return 'caster';
		case TagRole[TagRole.FIGHTER]:
			return 'fighter';
		case TagRole[TagRole.TANK]:
			return 'protector';
		case TagRole[TagRole.NEUTRAL]:
		case TagRole[TagRole.INVALID]:
			return null;
		default:
			console.error('Invalid role passed', roleFromEnum);
			return null;
	}
};

// export const getHeroAbilities = (heroCardId: string): readonly string[] => {
// 	switch (normalizeMercenariesHeroCardId(heroCardId)) {
// 		case 'LETL_031H_01': // Alexstrazza
// 			return ['LETL_031P7_01', 'LETL_031P4_01', 'LETL_031P2_01'];
// 		case 'LETL_034H_01': // Cairne Bloodhoof
// 			return ['LETL_034P3_01', 'LETL_319_01', 'LETL_246_01'];
// 		case 'LETL_020H_01': // Cariel Roame
// 			return ['LETL_406_01', 'LETL_409_01', 'LETL_020P6_01'];
// 		case 'SWL_06H_01': // Cornelius Roame
// 			return ['LETL_440_01', 'LETL_441_01', 'LETL_002P5_01'];
// 		case 'BARL_013H_01': // Garrosh Hellscream
// 			return ['LETL_229_01', 'LETL_224_01', 'LETL_309_01'];
// 		case 'LETL_009H_01': // Grommash Hellscream
// 			return ['LETL_009P7_01', 'LETL_414_01', 'LETL_413_01'];
// 		case 'LETL_033H_01': // Gruul
// 			return ['LETL_033P5_01', 'LETL_033P2_01', 'LETL_033P4_01'];
// 		case 'LETL_038H_01': // King Mukla
// 			return ['LETL_274_01', 'LETL_275_01', 'LETL_276_01'];
// 		case 'LETL_007H_01': // Kurtrus Ahfallen
// 			return ['LETL_007P7_01', 'LETL_007P5_01', 'LETL_007P4_01'];
// 		case 'LETL_041H_01': // The Lich King
// 			return ['LETL_316_01', 'LETL_317_01', 'LETL_318_01'];
// 		case 'LETL_006H_01': // Lord Jaraxxus
// 			return ['LETL_006P8_01', 'LETL_006P9_01', 'LETL_006P1_01'];
// 		case 'BARL_017H_01': // Malfurion Stormrage
// 			return ['LETL_470_01', 'LETL_471_01', 'LETL_472_01'];
// 		case 'BARL_012H_01': // Mannoroth
// 			return ['LETL_250_01', 'LETL_257_01', 'LETL_251_01'];
// 		case 'LETL_028H_03': // Ragnaros
// 			return ['LETL_028P11_01', 'LETL_028P9_01', 'LETL_005P3_01'];
// 		case 'BARL_025H_01': // Thrall
// 			return ['LETL_220_01', 'LETL_222_01', 'LETL_225_01'];
// 		case 'LETL_012H_01': // Varian Wrynn
// 			return ['LETL_012P7_01', 'LETL_012P6_01', 'LETL_012P4_01'];

// 		case 'BARL_024H_01': // Blademaster Samuro
// 			return ['LETL_232_01', 'LETL_233_01', 'LETL_234_01'];
// 		case 'SWL_26H_01': // Diablo
// 			return ['LETL_235_01', 'LETL_236_01', 'LETL_237_01'];
// 		case 'LETL_003H_01': // Illidan Stormrage
// 			return ['LETL_003P8_01', 'LETL_003P1_01', 'LETL_003P4_01'];
// 		case 'LETL_037H_01': // King Krush
// 			return ['LETL_282_01', 'LETL_037P2_01', 'LETL_269_01'];
// 		case 'BARL_007H_01': // Lady Anacondra
// 			return ['LETL_340_01', 'LETL_342_01', 'LETL_341_01'];
// 		case 'BARL_008H_01': // Mutanus
// 			return ['LETL_280_01', 'LETL_004P1_01', 'LETL_281_01'];
// 		case 'LETL_026H_01': // Old Murk-Eye
// 			return ['LETL_026P8_01', 'LETL_027P3_01', 'LETL_026P4_01'];
// 		case 'BARL_023H_01': // Rathorian
// 			return ['LETL_256_01', 'LETL_252_01', 'LETL_258_01'];
// 		case 'LETL_015H_01': // Rexxar
// 			return ['LETL_262_01', 'LETL_263_01', 'LETL_015P9_01'];
// 		case 'LETL_016H_01': // Rokara
// 			return ['LETL_410_01', 'LETL_411_01', 'LETL_412_01'];
// 		case 'BARL_002H_01': // Saurfang
// 			return ['LETL_009P9_01', 'LETL_009P6_01', 'LETL_009P1_01'];
// 		case 'LETL_010H_01': // Scabbs Cutterbutter
// 			return ['LETL_010P2_01', 'LETL_480_01', 'LETL_481_01'];
// 		case 'LETL_001H_01': // Sylvanas Windrunner
// 			return ['LETL_001P9_01', 'LETL_001P5_01', 'LETL_001P3_01'];
// 		case 'LETL_039H_01': // Tavish Stormpike
// 			return ['LETL_039P8_01', 'LETL_039P5_01', 'LETL_039P6_01'];
// 		case 'LETL_002H_01': // Tirion Fordring
// 			return ['LETL_002P7_01', 'LETL_002P4_01', 'LETL_002P3_01'];
// 		case 'BARL_016H_01': // Tyrande
// 			return ['LETL_403_01', 'LETL_404_01', 'LETL_405_01'];
// 		case 'BARL_009H_01': // War Master Voone
// 			return ['LETL_290_01', 'LETL_292_01', 'LETL_291_01'];
// 		case 'LETL_019H_01': // Valeera Sanguinar
// 			return ['LETL_010P5_01', 'LETL_019P1_01', 'LETL_013P3_01'];

// 		case 'SWL_10H_01': // Anduin Wrynn
// 			return ['LETL_420_01', 'LETL_014P3_01', 'LETL_422_01'];
// 		case 'SWL_01H_01': // Antonidas
// 			return ['LETL_450_01', 'LETL_451_01', 'LETL_452_01'];
// 		case 'LETL_030H_01': // Baron Geddon
// 			return ['LETL_030P3_01', 'LETL_030P4_01', 'LETL_030P6_01'];
// 		case 'SWL_14H_01': // Blink Fox
// 			return ['LETL_336_01', 'LETL_337_01', 'LETL_338_01'];
// 		case 'LETL_032H_01': // Brightwing
// 			return ['LETL_032P6_01', 'LETL_032P4_01', 'LETL_032P5_01'];
// 		case 'LETL_029H_01': // Bru'kan
// 			return ['LETL_029P5_01', 'LETL_029P10_01', 'LETL_029P6_01'];
// 		case 'LETL_036H_01': // Guff Runetotem
// 			return ['LETL_460_01', 'LETL_463_01', 'LETL_462_01'];
// 		case 'BARL_010H_01': // Gul'dan
// 			return ['LETL_300_01', 'LETL_302_01', 'LETL_301_01'];
// 		case 'SWL_25H_01': // Jaina Proudmoore
// 			return ['LETL_017P6_01', 'LETL_017P2_01', 'LETL_308_01'];
// 		case 'LETL_005H_01': // Millhouse Manastorm
// 			return ['LETL_005P4_01', 'LETL_005P8_01', 'LETL_022P4_01'];
// 		case 'LETL_027H_01': // Morgl the Oracle
// 			return ['LETL_027P6_01', 'LETL_027P2_01', 'LETL_029P12_01'];
// 		case 'LETL_011H_01': // Natalie Seline
// 			return ['LETL_331_01', 'LETL_330_01', 'LETL_332_01a'];
// 		case 'LETL_014H_01': // Prophet Velen
// 			return ['LETL_021P5_01', 'LETL_014P2_01', 'LETL_014P6_01'];
// 		case 'LETL_040H_01': // Tamsin Roame
// 			return ['LETL_040P3_01', 'LETL_040P7_01', 'LETL_040P9_01'];
// 		case 'SWL_13H_01': // Uther
// 			return ['LETL_430_01', 'LETL_431_01', 'LETL_432_01'];
// 		case 'LETL_017H_01': // Varden Dawngrasp
// 			return ['LETL_306_01', 'LETL_307_01', 'LETL_017P7_01'];
// 		case 'BARL_005H_01': // Vol'jin
// 			return ['LETL_320_01', 'LETL_324_01', 'LETL_328_01'];
// 		case 'LETL_021H_01': // Xyrella
// 			return ['LETL_014P1_01', 'LETL_407_01', 'LETL_408_01'];
// 	}
// };

// // TODO: this will disappear once we have a proper card DB
// export const CASTERS = [
// 	'SWL_10H_01', // Anduin
// 	'SWL_01H_01', // Antonidas
// 	'LETL_030H_01', // Baron geddon
// 	'SWL_14H_01', // Bilnk Fox
// 	'LETL_032H_01', // Brightwing
// 	'LETL_029H_01', // Bru'kan
// 	'LETL_036H_01', // Guff Runetotem
// 	'BARL_010H_01', // Gul'dan
// 	'SWL_25H_01', // Jaina Proudmoore
// 	'LETL_005H_01', // Millhouse Manastorm
// 	'LETL_027H_01', // Morgl the Oracle
// 	'LETL_011H_01', // Natalie Seline
// 	'LETL_014H_01', // Prophet Velen
// 	'LETL_040H_01', // Tamsin Roane
// 	'SWL_13H_01', // Uther
// 	'LETL_017H_01', // Varden Dawngrasp
// 	'BARL_005H_01', // Vol'jin
// 	'LETL_021H_01', // Xyrella
// ];

// export const FIGHTERS = [
// 	'BARL_024H_01', // Blademaster Samuro
// 	'SWL_26H_01', // Diablo
// 	'LETL_003H_01', // Illidan Stormrage
// 	'LETL_037H_01', // King Krush
// 	'BARL_007H_01', // Lady Anacondra
// 	'BARL_008H_01', // Mutanus
// 	'LETL_026H_01', // Old murk-eye
// 	'BARL_023H_01', // Rathorian
// 	'LETL_015H_01', // Rexxar
// 	'LETL_016H_01', // Rokara
// 	'BARL_002H_01', // Saurfang
// 	'LETL_010H_01', // Scabbs Cutterbutter
// 	'LETL_001H_01', // Sylvanas Windrunner
// 	'LETL_039H_01', // Tavish Stormpike
// 	'LETL_002H_01', // Tirion Fordring
// 	'BARL_016H_01', // Tyrande
// 	'BARL_009H_01', // War Master Voone
// 	'LETL_019H_01', // Valeera Sanguinar
// ];

// export const PROTECTORS = [
// 	'LETL_031H_01', // Alexstrasza
// 	'LETL_034H_01', // Cairne Bloodhoof
// 	'LETL_020H_01', // Cariel Roame
// 	'SWL_06H_01', // Cornelius Roame
// 	'BARL_013H_01', // Garrosh Hellscream
// 	'LETL_009H_01', // Grommash Hellscream
// 	'LETL_033H_01', // Gruul
// 	'LETL_038H_01', // King Mukla
// 	'LETL_007H_01', // Kurtrus Ashfallen
// 	'LETL_041H_01', // The Lich King
// 	'LETL_006H_01', // Lord Jaraxxus
// 	'BARL_017H_01', // Malfurion Stormrage
// 	'BARL_012H_01', // Mannoroth
// 	'LETL_028H_01', // Ragnaros
// 	'BARL_025H_01', // Thrall
// 	'LETL_012H_01', // Varian Wrynn
// ];
