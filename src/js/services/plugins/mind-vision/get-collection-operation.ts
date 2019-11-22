import { Card } from '../../../models/card';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetCollectionOperation extends MindVisionOperationFacade<readonly Card[]> {
	constructor(private mindVision: MindVisionService) {
		super(
			'getCollection',
			() => this.mindVision.getCollection(),
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
