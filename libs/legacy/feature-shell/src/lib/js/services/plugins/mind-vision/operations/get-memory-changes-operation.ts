import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryUpdate } from '@models/memory/memory-update';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetMemoryChangesOperation extends MindVisionOperationFacade<MemoryUpdate> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getMemoryChanges',
			() => mindVision.getMemoryChanges(),
			(info) => false,
			(info) => info,
			2,
			200,
		);
	}
}
