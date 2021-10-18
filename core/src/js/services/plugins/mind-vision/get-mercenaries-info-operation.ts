import { MemoryMercenariesInfo } from '../../../models/memory/memory-mercenaries-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetMercenariesInfoOperation extends MindVisionOperationFacade<MemoryMercenariesInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
