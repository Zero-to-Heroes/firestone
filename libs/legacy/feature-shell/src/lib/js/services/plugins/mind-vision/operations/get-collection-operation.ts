import { Card } from '@models/card';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { SetsService } from '../../../collection/sets-service.service';

export class GetCollectionOperation extends MindVisionOperationFacade<readonly Card[]> {
	private basicCards;

	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, private allCards: SetsService) {
		super(
			ow,
			'getCollection',
			() => mindVision.getCollection(),
			(memoryCollection: any[]) =>
				memoryCollection.length === 0 ||
				memoryCollection.every((entry) => entry.Count + entry.PremiumCount === 0),
			(memoryCollection) =>
				memoryCollection.map(
					(memoryCard) =>
						({
							id: memoryCard.CardId,
							count: memoryCard.Count,
							premiumCount: memoryCard.PremiumCount,
							diamondCount: memoryCard.DiamondCount,
							signatureCount: memoryCard.SignatureCount,
						} as Card),
				),
			20,
			5000,
		);
	}
}
