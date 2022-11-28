import { MemoryMercenariesInfo } from '@models/memory/memory-mercenaries-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

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
