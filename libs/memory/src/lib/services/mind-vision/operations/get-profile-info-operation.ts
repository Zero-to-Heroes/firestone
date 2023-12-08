import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryPlayerProfileInfo } from '../../../models/memory-profile-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

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
