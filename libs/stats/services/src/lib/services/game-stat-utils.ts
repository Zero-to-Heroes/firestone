import { GALAKROND_EVIL, GALAKROND_EXPLORER } from '@firestone-hs/reference-data';
import { StatGameFormatType } from '@firestone-hs/replay-metadata';
import { capitalizeEachWord } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';

export const buildPlayerRankImage = (
	stat: GameStat,
	i18n: ILocalizationService,
): {
	frameImage?: string;
	medalImage?: string;
	tooltip?: string;
	frameDecoration?: string;
} => {
	let rankIcon;
	let rankIconTooltip;
	if (stat.gameMode === 'ranked') {
		const prefix = 'standard_ranked';
		const decoration = buildDecoration(stat.gameFormat);
		// TODO: add a "no-rank" image
		if (!stat.playerRank) {
			return {};
		}
		if (stat.playerRank.indexOf('legend') !== -1) {
			rankIcon = `${prefix}/legend`;
			rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.legend-format', {
				format: capitalizeEachWord(stat.gameFormat),
			});
		} else if (stat.playerRank.indexOf('-') > -1) {
			const leagueId = parseInt(stat.playerRank.split('-')[0]);
			const rank = stat.playerRank.split('-')[1];
			const paddedRank = rank.padStart(2, '0');
			const [leagueFrame, leagueName] = getLeagueInfo(leagueId);
			return {
				frameImage: leagueFrame,
				medalImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/RankedPlay_Medal_Portrait_${leagueName}_${paddedRank}.png`,
				frameDecoration: decoration ?? undefined,
				tooltip: i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder', {
					format: i18n.translateString(`global.format.${stat.gameFormat.toLowerCase()}`),
					leagueName: i18n.translateString(`global.ranks.constructed.${leagueName.toLowerCase()}`),
					rank: rank,
				}),
			};
		} else if (stat.playerRank.indexOf('-') === -1) {
			rankIcon = `${prefix}/rank${stat.playerRank}_small`;
			rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder-fallback', {
				format: capitalizeEachWord(stat.gameFormat),
				rank: stat.playerRank,
			});
		} else {
			rankIcon = `${prefix}/rank25_small`;
			rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder-default', {
				format: capitalizeEachWord(stat.gameFormat),
			});
		}
	} else if (stat.gameMode === 'battlegrounds' || stat.gameMode === 'battlegrounds-friendly') {
		rankIcon = 'battlegrounds';
		rankIconTooltip = i18n.translateString(`global.game-mode.${stat.gameMode}`);
	} else if (stat.gameMode === 'battlegrounds-duo') {
		rankIcon = 'battlegrounds-duo';
		rankIconTooltip = i18n.translateString(`global.game-mode.${stat.gameMode}`);
	} else if (stat.gameMode?.startsWith('mercenaries')) {
		rankIcon = 'mercenaries';
		rankIconTooltip =
			stat.gameMode === 'mercenaries-pvp'
				? i18n.translateString('global.game-mode.mercenaries-pvp')
				: i18n.translateString('global.game-mode.mercenaries-pve');
	} else if (stat.gameMode === 'practice') {
		const scenarioId = stat.scenarioId;
		if (scenarioId != null && GALAKROND_EXPLORER.indexOf(scenarioId) !== -1) {
			rankIcon = 'galakrond_explorers';
			rankIconTooltip = i18n.translateString('global.game-mode.galakrond-explorers');
		} else if (scenarioId != null && GALAKROND_EVIL.indexOf(scenarioId) !== -1) {
			rankIcon = 'galakrond_evil';
			rankIconTooltip = i18n.translateString('global.game-mode.galakrond-evil');
		} else {
			rankIcon = 'casual';
			rankIconTooltip = i18n.translateString('global.game-mode.practice');
		}
	} else if (stat.gameMode === 'casual') {
		rankIcon = 'casual';
		rankIconTooltip = i18n.translateString('global.game-mode.casual');
	} else if (stat.gameMode === 'friendly') {
		rankIcon = 'friendly';
		rankIconTooltip = i18n.translateString('global.game-mode.friendly');
	} else if (stat.gameMode === 'arena') {
		if (!stat.playerRank) {
			return {};
		}
		if ((stat.buildNumber ?? 0) <= 221850) {
			if (stat.playerRank.indexOf('-') !== -1) {
				const wins = stat.playerRank.split('-')[0];
				rankIcon = `arena/arena${wins}wins`;
				rankIconTooltip = i18n.translateString('global.game-mode.arena');
			} else {
				const wins = Math.ceil(+stat.playerRank);
				rankIcon = `arena/arena${wins}wins`;
				rankIconTooltip = i18n.translateString('global.game-mode.arena');
				console.debug('arena icon', wins, rankIcon);
			}
		} else {
			return {
				frameImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/arena_new.webp`,
				tooltip: i18n.translateString('global.game-mode.arena'),
			};
		}
	} else if (stat.gameMode === 'arena-underground') {
		return {
			frameImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/arena_underground.webp`,
			tooltip: i18n.translateString('global.game-mode.arena-underground'),
		};
	} else if (stat.gameMode === 'tavern-brawl') {
		rankIcon = 'tavernbrawl';
		rankIconTooltip = i18n.translateString('global.game-mode.tavern-brawl');
	} else {
		rankIcon = 'arenadraft';
	}

	return {
		frameImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/${rankIcon}.png`,
		tooltip: rankIconTooltip,
	};
};

const buildDecoration = (gameFormat: StatGameFormatType) => {
	switch (gameFormat) {
		case 'classic':
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Classic.png`;
		case 'twist':
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Twist.webp`;
		case 'wild':
			return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Wild.png`;
		default:
			return null;
	}
};

const getLeagueInfo = (leagueId: number): [string, string] => {
	const leagueName = getLeagueName(leagueId);
	return [
		`https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Ranked_Medal_Frame_${leagueName}.png`,
		leagueName,
	];
};

const getLeagueName = (leagueId: number): string => {
	switch (leagueId) {
		case 5:
			return 'Bronze';
		case 4:
			return 'Silver';
		case 3:
			return 'Gold';
		case 2:
			return 'Platinum';
		case 1:
			return 'Diamond';
		default:
			return '';
	}
};
