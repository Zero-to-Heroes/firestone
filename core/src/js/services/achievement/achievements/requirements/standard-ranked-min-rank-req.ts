import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class StandardRankedMinLeagueReq implements Requirement {
	private isRanked: boolean;
	private isStandard: boolean;
	private isMinLeague: boolean;

	constructor(private readonly targetRank: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for StandardRankedMinRankReq', rawReq);
		}
		return new StandardRankedMinLeagueReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isRanked = undefined;
		this.isStandard = undefined;
		this.isMinLeague = undefined;
		// console.log('[debug] [ranked-min] reset');
	}

	afterAchievementCompletionReset(): void {
		this.isRanked = undefined;
		this.isStandard = undefined;
		this.isMinLeague = undefined;
		// console.log('[debug] [ranked-min] afterAchievementCompletionReset');
	}

	isCompleted(): boolean {
		if (process.env.LOCAL_TEST) {
			return true;
		}
		// console.log('[debug] [ranked-min] isCompleted?', this.isRanked, this.isStandard, this.isMinLeague);
		return this.isRanked && this.isStandard && this.isMinLeague;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleMetadataEvent(gameEvent);
		}
		if (gameEvent.type === GameEvent.PLAYERS_INFO) {
			this.handlePlayerEvent(gameEvent);
		}
	}

	private handleMetadataEvent(gameEvent: GameEvent) {
		if (gameEvent.additionalData.metaData.GameType === 7) {
			this.isRanked = true;
		}
		if (gameEvent.additionalData.metaData.FormatType === 2) {
			this.isStandard = true;
		}
		// console.log('[debug] [ranked-min] metadata gametype', this.isRanked, gameEvent.additionalData.metaData);
		// console.log('[debug] [ranked-min] metadata formatType', this.isStandard, gameEvent.additionalData.metaData);
	}

	private handlePlayerEvent(gameEvent: GameEvent) {
		//console.log('handling player event', gameEvent);
		if (
			gameEvent.additionalData?.playerInfo?.standard?.leagueId <= this.targetRank ||
			gameEvent.additionalData?.playerInfo?.standard?.legendRank > 0
		) {
			//console.log('isMinLeague', true, this.targetRank);
			this.isMinLeague = true;
		}
		// console.log('[debug] [ranked-min] player', this.isMinLeague, gameEvent.localPlayer.standard);
	}
}
