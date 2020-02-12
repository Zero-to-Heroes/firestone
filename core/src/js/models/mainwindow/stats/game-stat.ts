import { GALAKROND_EVIL, GALAKROND_EXPLORER } from '@firestone-hs/reference-data';
import { CoinPlayType } from '../replays/coin-play.type';
import { MatchResultType } from '../replays/match-result.type';
import { MatchStats } from './match-stats';
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
	readonly playerCardId: string;
	readonly playerDecklist: string | undefined;
	readonly playerDeckName: string | undefined;
	readonly opponentClass: string;
	readonly opponentRank: string | undefined;
	readonly opponentCardId: string;
	readonly opponentName: string;
	readonly reviewId: string;
	readonly matchStat: MatchStats;

	public buildPlayerRankImage(): [string, string] {
		let rankIcon;
		let rankIconTooltip;
		if (this.gameMode === 'ranked') {
			const standard = 'standard_ranked';
			if (this.playerRank === 'legend') {
				rankIcon = `${standard}/legend`;
				rankIconTooltip = 'Legend';
			} else if (!this.playerRank || parseInt(this.playerRank) >= 25) {
				rankIcon = `${standard}/rank25_small`;
				rankIconTooltip = 'Rank 25';
			} else {
				rankIcon = `${standard}/rank${this.playerRank}_small`;
				rankIconTooltip = 'Rank ' + this.playerRank;
			}
		} else if (this.gameMode === 'battlegrounds') {
			rankIcon = 'battlegrounds';
			rankIconTooltip = 'Battlegrounds';
		} else if (this.gameMode === 'practice') {
			if (GALAKROND_EXPLORER.indexOf(this.scenarioId) !== -1) {
				rankIcon = 'galakrond_explorers';
				rankIconTooltip = "Galakrond's Awakening - Explorers";
			} else if (GALAKROND_EVIL.indexOf(this.scenarioId) !== -1) {
				rankIcon = 'galakrond_evil';
				rankIconTooltip = "Galakrond's Awakening - E.V.I.L.";
			} else {
				rankIcon = 'casual';
				rankIconTooltip = 'Practice';
			}
		} else if (this.gameMode === 'casual') {
			rankIcon = 'casual';
			rankIconTooltip = 'Casual';
		} else if (this.gameMode === 'friendly') {
			rankIcon = 'friendly';
			rankIconTooltip = 'Friendly';
		} else if (this.gameMode === 'arena') {
			// New format
			if (this.playerRank.indexOf('-') !== -1) {
				const wins = this.playerRank.split('-')[0];
				// const losses = this.playerRank.split('-')[1];
				rankIcon = `arena/arena${wins}wins`;
			} else {
				rankIcon = 'arena/arena12wins';
				rankIconTooltip = 'Arena';
			}
		} else if (this.gameMode === 'tavern-brawl') {
			rankIcon = 'tavernbrawl';
			rankIconTooltip = 'Tavern Brawl';
		} else {
			rankIcon = 'arenadraft';
		}
		return [`/Files/assets/images/deck/ranks/${rankIcon}.png`, rankIconTooltip];
	}

	public buildRankText(): string {
		if (this.gameMode === 'ranked') {
			return this.playerRank;
		}
		if (this.gameMode === 'arena') {
			const wins = this.playerRank.split('-')[0];
			const losses = this.playerRank.split('-')[1];
			return `${wins}-${losses}`;
		}
		// Bug for old matches
		if (this.gameMode === 'battlegrounds' && this.playerRank && parseInt(this.playerRank) > 100) {
			return this.playerRank;
		}
		return null;
	}
}
