import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryMercenariesInfo } from '../../../models/memory-mercenaries-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetMercenariesInfoOperation extends MindVisionOperationFacade<MemoryMercenariesInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getMercenariesInfo',
			(forceReset?: boolean) => mindVision.getMercenariesInfo(forceReset),
			(info) => false,
			(info) => info,
			2,
			1000,
		);
	}
}
