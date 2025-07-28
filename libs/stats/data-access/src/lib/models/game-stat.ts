import { BgsBoard, BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BnetRegion, GALAKROND_EVIL, GALAKROND_EXPLORER, isMercenariesPvP, Race } from '@firestone-hs/reference-data';
import { capitalizeEachWord, NonFunctionProperties } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { deflate, inflate } from 'pako';
import { StatGameFormatType } from './stat-game-format.type';
import { StatGameModeType } from './stat-game-mode.type';

// this mirrors the data structure in the replay_summary DB
export class GameStat {
	readonly additionalResult: string;
	readonly creationTimestamp: number;
	readonly gameMode: StatGameModeType;
	readonly gameFormat: StatGameFormatType;
	readonly buildNumber: number | undefined;
	readonly scenarioId: number | undefined;
	readonly result: MatchResultType;
	readonly coinPlay: CoinPlayType;
	readonly playerName: string;
	readonly playerClass: string;
	readonly playerRank: string | undefined;
	readonly newPlayerRank: string | undefined;
	readonly playerCardId: string;
	readonly playerDecklist: string | undefined;
	readonly playerDeckName: string | undefined;
	readonly opponentClass: string;
	readonly opponentRank: string | undefined;
	readonly opponentCardId: string;
	readonly opponentName: string;
	readonly reviewId: string;
	readonly gameDurationSeconds: number;
	readonly gameDurationTurns: number;
	readonly runId: string;
	readonly playerArchetypeId?: string;
	readonly opponentArchetypeId?: string;
	readonly bgsAvailableTribes: readonly Race[];
	readonly bgsBannedTribes: readonly Race[];
	readonly bgsPerfectGame: boolean;
	readonly levelAfterMatch: string;
	readonly bgsHasPrizes: boolean;
	readonly bgsHasSpells: boolean;
	readonly bgsHasQuests: boolean;
	readonly bgsHeroQuests: readonly string[];
	readonly bgsAnomalies: readonly string[];
	readonly bgsQuestsCompletedTimings: readonly number[];
	readonly bgsHeroQuestRewards: readonly string[];
	readonly region: BnetRegion;
	readonly bgsTrinkets: readonly string[];
	readonly bgsCompArchetype: string | null;
	/** Compressed + base64 encoded */
	readonly finalComp?: string;

	readonly postMatchStats?: BgsPostMatchStats;
	/** @deprecated */
	readonly mercHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	/** @deprecated */
	readonly mercOpponentHeroTimings: readonly { cardId: string; turnInPlay: number }[];
	/** @deprecated */
	readonly mercEquipments: readonly { mercCardId: string; equipmentCardId: string }[];
	/** @deprecated */
	readonly mercOpponentEquipments: readonly { mercCardId: string; equipmentCardId: string }[];

	public static create(base: Partial<NonFunctionProperties<GameStat>>): GameStat {
		return Object.assign(new GameStat(), base);
	}

	public update(base: Partial<NonFunctionProperties<GameStat>>): GameStat {
		return Object.assign(new GameStat(), this, base);
	}

	public isBattlegrounds(): boolean {
		return (
			this.gameMode === 'battlegrounds' ||
			this.gameMode === 'battlegrounds-friendly' ||
			this.gameMode === 'battlegrounds-duo'
		);
	}

	public buildPlayerRankImage(i18n: ILocalizationService): {
		frameImage?: string;
		medalImage?: string;
		tooltip?: string;
		frameDecoration?: string;
	} {
		let rankIcon;
		let rankIconTooltip;
		if (this.gameMode === 'ranked') {
			const prefix = 'standard_ranked';
			const decoration = this.buildDecoration(this.gameFormat);
			// TODO: add a "no-rank" image
			if (!this.playerRank) {
				return {};
			}
			if (this.playerRank.indexOf('legend') !== -1) {
				rankIcon = `${prefix}/legend`;
				rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.legend-format', {
					format: capitalizeEachWord(this.gameFormat),
				});
			} else if (this.playerRank.indexOf('-') > -1) {
				const leagueId = parseInt(this.playerRank.split('-')[0]);
				const rank = this.playerRank.split('-')[1];
				const paddedRank = rank.padStart(2, '0');
				const [leagueFrame, leagueName] = this.getLeagueInfo(leagueId);
				return {
					frameImage: leagueFrame,
					medalImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/RankedPlay_Medal_Portrait_${leagueName}_${paddedRank}.png`,
					frameDecoration: decoration,
					tooltip: i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder', {
						format: i18n.translateString(`global.format.${this.gameFormat.toLowerCase()}`),
						leagueName: i18n.translateString(`global.ranks.constructed.${leagueName.toLowerCase()}`),
						rank: rank,
					}),
				};
			} else if (this.playerRank.indexOf('-') === -1) {
				rankIcon = `${prefix}/rank${this.playerRank}_small`;
				rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder-fallback', {
					format: capitalizeEachWord(this.gameFormat),
					rank: this.playerRank,
				});
			} else {
				rankIcon = `${prefix}/rank25_small`;
				rankIconTooltip = i18n.translateString('app.replays.replay-info.game-mode-tooltip.ladder-default', {
					format: capitalizeEachWord(this.gameFormat),
				});
			}
		} else if (this.gameMode === 'battlegrounds' || this.gameMode === 'battlegrounds-friendly') {
			rankIcon = 'battlegrounds';
			rankIconTooltip = i18n.translateString(`global.game-mode.${this.gameMode}`);
		} else if (this.gameMode === 'battlegrounds-duo') {
			rankIcon = 'battlegrounds-duo';
			rankIconTooltip = i18n.translateString(`global.game-mode.${this.gameMode}`);
		} else if (this.gameMode?.startsWith('mercenaries')) {
			rankIcon = 'mercenaries';
			rankIconTooltip =
				this.gameMode === 'mercenaries-pvp'
					? i18n.translateString('global.game-mode.mercenaries-pvp')
					: i18n.translateString('global.game-mode.mercenaries-pve');
		} else if (this.gameMode === 'practice') {
			if (GALAKROND_EXPLORER.indexOf(this.scenarioId) !== -1) {
				rankIcon = 'galakrond_explorers';
				rankIconTooltip = i18n.translateString('global.game-mode.galakrond-explorers');
			} else if (GALAKROND_EVIL.indexOf(this.scenarioId) !== -1) {
				rankIcon = 'galakrond_evil';
				rankIconTooltip = i18n.translateString('global.game-mode.galakrond-evil');
			} else {
				rankIcon = 'casual';
				rankIconTooltip = i18n.translateString('global.game-mode.practice');
			}
		} else if (this.gameMode === 'casual') {
			rankIcon = 'casual';
			rankIconTooltip = i18n.translateString('global.game-mode.casual');
		} else if (this.gameMode === 'friendly') {
			rankIcon = 'friendly';
			rankIconTooltip = i18n.translateString('global.game-mode.friendly');
		} else if (this.gameMode === 'arena') {
			if (!this.playerRank) {
				return {};
			}
			if (this.buildNumber <= 221850) {
				if (this.playerRank.indexOf('-') !== -1) {
					const wins = this.playerRank.split('-')[0];
					rankIcon = `arena/arena${wins}wins`;
					rankIconTooltip = i18n.translateString('global.game-mode.arena');
				} else {
					const wins = Math.ceil(+this.playerRank);
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
		} else if (this.gameMode === 'arena-underground') {
			return {
				frameImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/arena_underground.webp`,
				tooltip: i18n.translateString('global.game-mode.arena-underground'),
			};
		} else if (this.gameMode === 'tavern-brawl') {
			rankIcon = 'tavernbrawl';
			rankIconTooltip = i18n.translateString('global.game-mode.tavern-brawl');
		} else {
			rankIcon = 'arenadraft';
		}

		return {
			frameImage: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/${rankIcon}.png`,
			tooltip: rankIconTooltip,
		};
	}

	private buildDecoration(gameFormat: StatGameFormatType) {
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
	}

	private getLeagueInfo(leagueId: number): [string, string] {
		const leagueName = this.getLeagueName(leagueId);
		return [
			`https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Ranked_Medal_Frame_${leagueName}.png`,
			leagueName,
		];
	}

	private getLeagueName(leagueId: number): string {
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
	}

	// eslint-disable-next-line @typescript-eslint/member-ordering
	public static encodeBgsFinalComp(finalComp: BgsBoard | null | undefined): string {
		if (!finalComp?.board?.length) {
			return null;
		}

		const compressedStats = deflate(JSON.stringify(finalComp));
		const base64data = Buffer.from(compressedStats).toString('base64');
		return base64data;
	}
	// eslint-disable-next-line @typescript-eslint/member-ordering
	public static decodeBgsFinalComp(finalComp: string | null | undefined): BgsBoard {
		if (!finalComp?.length) {
			return null;
		}

		const compressedStats = Buffer.from(finalComp, 'base64');
		const stats = inflate(compressedStats, { to: 'string' });
		return JSON.parse(stats);
	}
}

export const buildNewFormatGameModeImage = (gameMode: 'arena' | 'arena-underground'): string => {
	const gameModeKey = gameMode === 'arena-underground' ? 'arena_underground' : 'arena_new';
	return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/${gameModeKey}.webp`;
};

export const buildRankText = (playerRank: string | undefined, gameMode: string, additionalResult: string): string => {
	if (playerRank == null) {
		return null;
	}
	if (gameMode === 'ranked') {
		if (playerRank.indexOf('legend-') !== -1) {
			return playerRank.split('legend-')[1];
		} else if (playerRank.indexOf('-') > -1) {
			return playerRank.split('-')[1];
		}
		return playerRank;
	}
	if (gameMode === 'arena' || gameMode === 'arena-underground') {
		if (playerRank && playerRank.indexOf('-') !== -1) {
			const wins = playerRank.split('-')[0];
			const losses = playerRank.split('-')[1];
			return `${wins}-${losses}`;
		} else if (playerRank && playerRank !== 'undefined') {
			return playerRank;
		} else {
			return null;
		}
	}
	// Bug for old matches
	if ((gameMode === 'battlegrounds' || gameMode === 'battlegrounds-duo') && playerRank) {
		return playerRank;
	}
	if (isMercenariesPvP(gameMode) && !isNaN(+playerRank)) {
		return playerRank;
	}
	return null;
};

export type CoinPlayType = 'coin' | 'play';
export type MatchResultType = 'won' | 'lost' | 'tied';
