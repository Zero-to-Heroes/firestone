import { OverwolfService } from '@firestone/shared/framework/core';
import { MemoryDuelsHeroPowerOption } from '@models/memory/memory-duels';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetDuelsSignatureTreasureOptionsOperation extends MindVisionOperationFacade<
	readonly MemoryDuelsHeroPowerOption[]
> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, i18n: LocalizationFacadeService) {
		super(
			ow,
			'getDuelsSignatureTreasureOptions',
			(forceReset?: boolean) => mindVision.getDuelsSignatureTreasureOptions(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}
