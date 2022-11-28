import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { BattlegroundsInfo } from '../../../../../models/battlegrounds-info';
import { GameEvent } from '../../../../../models/game-event';
import { isBattlegrounds } from '../../../../battlegrounds/bgs-utils';
import { MemoryInspectionService } from '../../../../plugins/memory-inspection.service';
import { Requirement } from '../_requirement';

export class BattlegroundsRankReq implements Requirement {
	private isValid: boolean;
	private rankAtReset: number;
	private isBgs: boolean;

	constructor(private readonly memoryInspection: MemoryInspectionService, private readonly targetRank: number) {}

	public static create(rawReq: RawRequirement, memoryInspection: MemoryInspectionService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('[battlegrounds-rank-req] invalid parameters for BattlegroundsRankReq', rawReq);
		}
		return new BattlegroundsRankReq(memoryInspection, parseInt(rawReq.values[0]));
	}

	async reset() {
		this.isValid = undefined;
		this.isBgs = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isValid = undefined;
		this.isBgs = undefined;
	}

	isCompleted(): boolean {
		return this.isValid;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.MATCH_METADATA) {
			this.handleMetaData(gameEvent);
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectPlayerRank();
			return;
		}
	}

	private async handleMetaData(gameEvent: GameEvent) {
		this.isBgs = isBattlegrounds(gameEvent.additionalData.metaData.GameType);
		if (this.isBgs) {
			const battlegroundsInfo: BattlegroundsInfo = await this.memoryInspection.getBattlegroundsInfo();

			if (battlegroundsInfo) {
				this.rankAtReset = battlegroundsInfo.Rating;
			}
		} else {
			this.rankAtReset = undefined;
		}
	}

	private async detectPlayerRank() {
		if (!this.isBgs) {
			this.isValid = false;
			return;
		}
		const battlegroundsInfo: BattlegroundsInfo = await this.getRank();
		this.isValid =
			battlegroundsInfo &&
			battlegroundsInfo.Rating >= this.targetRank &&
			(!this.rankAtReset || battlegroundsInfo.Rating !== this.rankAtReset);
	}

	private async getRank() {
		return new Promise<BattlegroundsInfo>((resolve) => {
			this.getRankInternal((info) => resolve(info));
		});
	}

	private async getRankInternal(callback): Promise<void> {
		const rank = await this.memoryInspection.getBattlegroundsInfo();
		if (!rank || this.rankAtReset === rank.Rating) {
			setTimeout(() => this.getRankInternal(callback), 1000);
			return;
		}

		callback(rank);
	}
}
