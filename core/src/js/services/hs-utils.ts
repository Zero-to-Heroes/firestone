import { CardIds } from '@firestone-hs/reference-data';
import { capitalizeEachWord } from './utils';

export const classes = [
	'demonhunter',
	'druid',
	'hunter',
	'mage',
	'paladin',
	'priest',
	'rogue',
	'shaman',
	'warrior',
	'warlock',
];

export const formatClass = (playerClass: string): string => {
	let update = playerClass;
	if (playerClass === 'demonhunter') {
		update = 'demon hunter';
	}
	return capitalizeEachWord(update);
};

export const globalEffectCards = [
	CardIds.Collectible.Druid.Embiggen,
	CardIds.Collectible.Druid.SurvivalOfTheFittest,
	CardIds.Collectible.Hunter.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.Collectible.Mage.LunasPocketGalaxy,
	CardIds.Collectible.Mage.IncantersFlow,
	// CardIds.Collectible.Neutral.BakuTheMooneater,
	CardIds.Collectible.Neutral.FrizzKindleroost,
	CardIds.Collectible.Neutral.LorekeeperPolkelt,
	// CardIds.Collectible.Neutral.GennGreymane,
	CardIds.Collectible.Neutral.PrinceKeleseth,
	CardIds.Collectible.Neutral.WyrmrestPurifier,
	CardIds.Collectible.Paladin.AldorAttendant,
	CardIds.Collectible.Paladin.AldorTruthseeker,
	CardIds.Collectible.Priest.ArchbishopBenedictus,
	CardIds.Collectible.Priest.LadyInWhite,
	CardIds.Collectible.Warlock.DarkPharaohTekahn,
	CardIds.Collectible.Warlock.RenounceDarkness,
	CardIds.NonCollectible.Neutral.ReductomaraToken,
	CardIds.NonCollectible.Neutral.UpgradedPackMule,
	CardIds.NonCollectible.Paladin.LordaeronAttendant,
	CardIds.NonCollectible.Rogue.TheCavernsBelow_CrystalCoreTokenUNGORO,
];
