import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryDuelsHeroPowerOption } from '../../../models/memory-duels';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetDuelsHeroPowerOptionsOperation extends MindVisionOperationFacade<
	readonly MemoryDuelsHeroPowerOption[]
> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsHeroPowerOptions',
			(forceReset?: boolean) => mindVision.getDuelsHeroPowerOptions(),
			(info: readonly MemoryDuelsHeroPowerOption[]) => info.some((option) => option.DatabaseId === 0),
			(info) => info,
			3,
			1500,
		);
	}
}
