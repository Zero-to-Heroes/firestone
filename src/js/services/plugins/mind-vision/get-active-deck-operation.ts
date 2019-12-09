import { OverwolfService } from '../../overwolf.service';
import { MindVisionOperationFacade } from './mind-vision-operation-facade';
import { MindVisionService } from './mind-vision.service';

export class GetActiveDeckOperation extends MindVisionOperationFacade<any> {
	constructor(mindVision: MindVisionService, ow: OverwolfService) {
		super(ow, 'getActiveDeck', () => mindVision.getActiveDeck(), deck => !deck, deck => deck);
	}
}
