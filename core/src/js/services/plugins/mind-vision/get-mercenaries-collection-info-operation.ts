import { MemoryMercenariesCollectionInfo } from '../../../models/memory/memory-mercenaries-collection-info';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetMercenariesCollectionInfoOperation extends MindVisionOperationFacade<MemoryMercenariesCollectionInfo> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getMercenariesCollectionInfo',
			(forceReset?: boolean) => mindVision.getMercenariesCollectionInfo(forceReset),
			(info) => !info?.Mercenaries?.length,
			(info) => info,
			5,
			800,
			// (info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length,
		);
	}
}
