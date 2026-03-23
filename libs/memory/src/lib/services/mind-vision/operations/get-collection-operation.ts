import { GameStatusService } from '@firestone/shared/common/service';
import { Card } from '../../../external-models/card';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetCollectionOperation extends MindVisionOperationFacade<readonly Card[]> {
	private basicCards;

	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getCollection',
			() => mindVision.getCollection(),
			(memoryCollection: any[]) =>
				memoryCollection.length === 0 ||
				memoryCollection.every((entry) => entry.Count + entry.PremiumCount === 0),
			(memoryCollection) =>
				memoryCollection.map((memoryCard) => {
					const result: Card = {
						id: memoryCard.CardId,
						count: memoryCard.Count,
						premiumCount: memoryCard.PremiumCount,
						diamondCount: memoryCard.DiamondCount,
						signatureCount: memoryCard.SignatureCount,
						trialCount: memoryCard.TrialCount,
						trialPremiumCount: memoryCard.TrialPremiumCount,
						trialDiamondCount: memoryCard.TrialDiamondCount,
						trialSignatureCount: memoryCard.TrialSignatureCount,
					};
					return result;
				}),
			20,
			5000,
		);
	}
}
