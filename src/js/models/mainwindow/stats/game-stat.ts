import { MatchStats } from './match-stats';

// this mirrors the data structure in the replay_summary DB
export class GameStat {
	readonly reviewId: string;
	readonly coinPlay: 'coin' | 'play';
	readonly opponentClass: string;
	readonly playerClass: string;
	// readonly playerDecklist: string | undefined; // This is not well handled on the server side yet
	readonly result: 'won' | 'lost' | 'tied';
	readonly gameMode: 'arena' | 'arena-draft' | 'casual' | 'friendly' | 'practice' | 'ranked' | 'tavern-brawl';
	readonly creationTimestamp: number;
	readonly gameFormat: 'standard' | 'wild';
	readonly playerCardId: string;
	readonly opponentCardId: string;
	readonly matchStat: MatchStats;
}
