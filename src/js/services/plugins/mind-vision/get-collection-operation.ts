import { Card } from '../../../models/card';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetCollectionOperation extends MindVisionOperationFacade<readonly Card[]> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(
			ow,
			'getCollection',
			() => mindVision.getCollection(),
			memoryCollection => memoryCollection.length === 0,
			memoryCollection =>
				memoryCollection.map(
					memoryCard =>
						({
							id: memoryCard.CardId,
							count: memoryCard.Count,
							premiumCount: memoryCard.PremiumCount,
						} as Card),
				),
		);
	}
}
