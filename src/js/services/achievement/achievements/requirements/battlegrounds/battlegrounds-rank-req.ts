import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { BattlegroundsInfo } from '../../../../../models/battlegrounds-info';
import { GameEvent } from '../../../../../models/game-event';
import { MemoryInspectionService } from '../../../../plugins/memory-inspection.service';
import { Requirement } from '../_requirement';

export class BattlegroundsRankReq implements Requirement {
	private isValid: boolean;

	constructor(private readonly memoryInspection: MemoryInspectionService, private readonly targetRank: number) {}

	public static create(rawReq: RawRequirement, memoryInspection: MemoryInspectionService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 1) {
			console.error('invalid parameters for BattlegroundsFinishReq', rawReq);
		}
		return new BattlegroundsRankReq(memoryInspection, parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.isValid = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isValid = undefined;
	}

	isCompleted(): boolean {
		return this.isValid;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectPlayerRank();
			return;
		}
	}

	private async detectPlayerRank() {
		const battlegroundsInfo: BattlegroundsInfo = await this.memoryInspection.getBattlegroundsInfo();
		this.isValid = battlegroundsInfo && battlegroundsInfo.rating >= this.targetRank;
	}
}
