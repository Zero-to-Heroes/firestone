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
	}

	afterAchievementCompletionReset(): void {
		this.isRanked = undefined;
		this.isStandard = undefined;
		this.isMinLeague = undefined;
	}

	isCompleted(): boolean {
		if (process.env.LOCAL_TEST) {
			return true;
		}

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
	}

	private handlePlayerEvent(gameEvent: GameEvent) {
		if (
			gameEvent.additionalData?.playerInfo?.standard?.leagueId <= this.targetRank ||
			gameEvent.additionalData?.playerInfo?.standard?.legendRank > 0
		) {
			this.isMinLeague = true;
		}
	}
}
