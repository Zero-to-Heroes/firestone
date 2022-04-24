import { MemoryMercenariesCollectionInfo } from '@models/memory/memory-mercenaries-collection-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetMercenariesCollectionInfoOperation extends MindVisionOperationFacade<MemoryMercenariesCollectionInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getMercenariesCollectionInfo',
			(forceReset?: boolean) => mindVision.getMercenariesCollectionInfo(forceReset),
			(info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length,
			(info: MemoryMercenariesCollectionInfo) => info,
			5,
			2000,
			// (info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length,
		);
	}
}
