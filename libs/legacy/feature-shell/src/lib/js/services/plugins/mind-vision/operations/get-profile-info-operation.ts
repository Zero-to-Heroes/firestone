import { CardClass, GameType } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetPlayerProfileInfoOperation extends MindVisionOperationFacade<MemoryPlayerProfileInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getProfileInfo',
			() => mindVision.getPlayerProfileInfo(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}

export interface MemoryPlayerProfileInfo {
	readonly PlayerRecords: readonly MemoryPlayerRecord[];
	readonly PlayerClasses: readonly MemoryPlayerClass[];
}

export interface MemoryPlayerRecord {
	readonly RecordType: GameType;
	readonly Data: number;
	readonly Wins: number;
	readonly Losses: number;
	readonly Ties: number;
}

export interface MemoryPlayerClass {
	readonly TagClass: CardClass;
	readonly Level: number;
}
