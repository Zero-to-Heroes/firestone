import { Board } from '@firestone-hs/reference-data';
import { GameStatusService } from '@firestone/shared/common/service';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionOperationFacade } from '../mind-vision-operation-facade';

export class GetBoardOperation extends MindVisionOperationFacade<Board> {
	constructor(mindVision: MindVisionFacadeService, gameStatus: GameStatusService) {
		super(
			gameStatus,
			'getMatchInfo',
			() => mindVision.getCurrentBoard(),
			(board: Board) => !board || (board as number) == -1,
			(board: Board) => board,
			3,
			1500,
		);
	}
}
