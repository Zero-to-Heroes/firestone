import { GameStatusService } from '@firestone/shared/common/service';
import { MemoryMercenariesCollectionInfo } from '../../../models/memory-mercenaries-collection-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetMercenariesCollectionInfoOperation extends MindVisionOperationFacade<MemoryMercenariesCollectionInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getMercenariesCollectionInfo',
			(forceReset?: boolean) => mindVision.getMercenariesCollectionInfo(forceReset),
			(info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length || info?.Visitors == null,
			(info: MemoryMercenariesCollectionInfo) => info,
			5,
			2000,
			// (info: MemoryMercenariesCollectionInfo) => !info?.Mercenaries?.length,
		);
	}
}
