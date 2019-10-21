import { MatchStats } from './match-stats';

// this mirrors the data structure in the replay_summary DB
export class GameStat {
	readonly creationTimestamp: number;
	readonly gameMode: 'arena' | 'arena-draft' | 'casual' | 'friendly' | 'practice' | 'ranked' | 'tavern-brawl';
	readonly gameFormat: 'standard' | 'wild';
	readonly buildNumber: number | undefined;
	readonly scenarioId: number | undefined;
	readonly result: 'won' | 'lost' | 'tied';
	readonly coinPlay: 'coin' | 'play';
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
}
