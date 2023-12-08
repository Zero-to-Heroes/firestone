import { GameFormat } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DuelsInfo } from '../../../models/memory-duels';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetDuelsInfoOperation extends MindVisionOperationFacade<DuelsInfo> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService) {
		super(
			ow,
			'getDuelsInfo',
			(forceReset?: boolean) => mindVision.getDuelsInfo(forceReset),
			(info) => false,
			(info) =>
				({
					...info,
					FormatType: GameFormat.FT_WILD,
					Name: undefined,
				} as DuelsInfo),
			3,
			1500,
		);
	}
}
