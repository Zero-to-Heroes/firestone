import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryDuelsHeroPowerOption } from '../../../models/memory-duels';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetDuelsSignatureTreasureOptionsOperation extends MindVisionOperationFacade<
	readonly MemoryDuelsHeroPowerOption[]
> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsSignatureTreasureOptions',
			(forceReset?: boolean) => mindVision.getDuelsSignatureTreasureOptions(),
			(info: readonly MemoryDuelsHeroPowerOption[]) => info.some((option) => option.DatabaseId === 0),
			(info) => info,
			3,
			1500,
		);
	}
}
