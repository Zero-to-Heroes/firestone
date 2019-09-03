import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class StandardRankedMinRankReq implements Requirement {
	private isRanked: boolean;
	private isStandard: boolean;
	private isMinRank: boolean;

	constructor(private readonly targetRank: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for StandardRankedMinRankReq', rawReq);
		}
		return new StandardRankedMinRankReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isRanked = undefined;
		this.isStandard = undefined;
		this.isMinRank = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isRanked = undefined;
		this.isStandard = undefined;
		this.isMinRank = undefined;
	}

	isCompleted(): boolean {
		return this.isRanked && this.isStandard && this.isMinRank;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleMetadataEvent(gameEvent);
		}
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
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
		if (gameEvent.localPlayer.standardRank <= this.targetRank || gameEvent.localPlayer.standardLegendRank > 0) {
			this.isMinRank = true;
		}
	}
}
