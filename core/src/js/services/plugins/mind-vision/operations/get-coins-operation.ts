import { CoinInfo } from '@models/memory/coin-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { SetsService } from '../../../collection/sets-service.service';

export class GetCoinsOperation extends MindVisionOperationFacade<readonly CoinInfo[]> {
	constructor(mindVision: MindVisionFacadeService, ow: OverwolfService, private allCards: SetsService) {
		super(
			ow,
			'getCoins',
			() => mindVision.getCoins(),
			(coins: any[]) => coins.length === 0,
			(coins) => coins,
			20,
			5000,
		);
	}
}
