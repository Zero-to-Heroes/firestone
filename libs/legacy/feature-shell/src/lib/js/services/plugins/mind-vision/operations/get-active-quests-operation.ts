import { QuestStatus } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetActiveQuestsOperation extends MindVisionOperationFacade<MemoryQuestsLog> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getActiveQuests',
			() => mindVision.getActiveQuests(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}

export interface MemoryQuestsLog {
	readonly Quests: readonly MemoryQuestInfo[];
}

export interface MemoryQuestInfo {
	readonly Id: number;
	readonly Progress: number;
	readonly Status: QuestStatus;
}
