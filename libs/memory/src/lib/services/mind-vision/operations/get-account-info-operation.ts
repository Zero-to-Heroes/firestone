import { GameStatusService } from '@firestone/shared/common/service';
import { AccountInfo } from '../../../models/account';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetAccountInfoOperation extends MindVisionOperationFacade<AccountInfo> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getAccountInfo',
			() => mindVision.getAccountInfo(),
			(info) => false,
			(info) => info,
			1,
			1500,
		);
	}
}
