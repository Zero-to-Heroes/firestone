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
			// Technically speaking it's possible to not have any visitors, but it's more of an outlier case for now
			(info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length || !info.Visitors?.length,
			(info: MemoryMercenariesCollectionInfo) => info,
			5,
			2000,
			// (info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length,
		);
	}
}
