import { CardBack } from '../../../models/card-back';
import { SetsService } from '../../collection/sets-service.service';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetCardBacksOperation extends MindVisionOperationFacade<readonly CardBack[]> {
	constructor(mindVision: MindVisionService, ow: OverwolfService, private allCards: SetsService) {
		super(
			ow,
			'getCardBacks',
			() => mindVision.getCardBacks(),
			(cardBacks: any[]) =>
				// Classic is ID = 0
				cardBacks.length === 0 || cardBacks.filter((cardBack) => cardBack.CardBackId === 0).length > 1,
			(cardBacks) => {
				const result = cardBacks.map(
					(cardBack) =>
						({
							id: cardBack.CardBackId,
							owned: true,
						} as CardBack),
				);
				console.debug('mapping card back results', result, cardBacks);
				return result;
			},
			20,
			5000,
		);
	}
}
