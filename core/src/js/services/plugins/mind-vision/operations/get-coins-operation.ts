import { CoinInfo } from '@models/memory/coin-info';
import { OverwolfService } from '@services/overwolf.service';
import { MindVisionOperationFacade } from '@services/plugins/mind-vision/mind-vision-operation-facade';
import { MindVisionService } from '@services/plugins/mind-vision/mind-vision.service';
import { SetsService } from '../../../collection/sets-service.service';

export class GetCoinsOperation extends MindVisionOperationFacade<readonly CoinInfo[]> {
	constructor(mindVision: MindVisionService, ow: OverwolfService, private allCards: SetsService) {
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
