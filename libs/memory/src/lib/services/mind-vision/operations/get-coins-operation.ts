import { GameStatusService } from '@firestone/shared/common/service';
import { CoinInfo } from '../../../models/coin-info';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetCoinsOperation extends MindVisionOperationFacade<readonly CoinInfo[]> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getCoins',
			() => mindVision.getCoins(),
			(coins: any[]) => coins.length === 0,
			(coins) => coins,
			20,
			5000,
		);
	}
}
