import { MemoryDuelsHeroPowerOption } from '@models/memory/memory-duels';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';

export class GetDuelsHeroPowerOptionsOperation extends MindVisionOperationFacade<
	readonly MemoryDuelsHeroPowerOption[]
> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, i18n: LocalizationFacadeService) {
		super(
			ow,
			'getDuelsHeroPowerOptions',
			(forceReset?: boolean) => mindVision.getDuelsHeroPowerOptions(),
			(info) => false,
			(info) => info,
			3,
			1500,
		);
	}
}
