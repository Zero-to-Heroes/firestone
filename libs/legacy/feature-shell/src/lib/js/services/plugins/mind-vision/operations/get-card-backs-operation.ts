import { OverwolfService } from '@firestone/shared/framework/core';
import { CardBack } from '@models/card-back';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { SetsService } from '../../../collection/sets-service.service';

export class GetCardBacksOperation extends MindVisionOperationFacade<readonly CardBack[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, private allCards: SetsService) {
		super(
			ow,
			'getCardBacks',
			() => mindVision.getCardBacks(),
			// Classic is ID = 0
			//|| cardBacks.filter((cardBack) => cardBack.CardBackId === 0).length > 1,
			(cardBacks: any[]) => cardBacks.length === 0,
			(cardBacks) => {
				const result = cardBacks.map(
					(cardBack) =>
						({
							id: cardBack.CardBackId,
							owned: true,
						} as CardBack),
				);
				return result;
			},
			20,
			5000,
		);
	}
}
