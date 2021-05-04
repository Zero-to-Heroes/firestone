import { CoinInfo } from '../../../models/memory/coin-info';
import { SetsService } from '../../collection/sets-service.service';
import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

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
