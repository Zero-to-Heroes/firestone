import { MemoryUpdate } from '../../../models/memory/memory-update';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetMemoryChangesOperation extends MindVisionOperationFacade<MemoryUpdate> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
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
