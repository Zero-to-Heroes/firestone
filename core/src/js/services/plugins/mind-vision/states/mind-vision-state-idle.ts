import { OverwolfService } from '@services/overwolf.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';

export class MindVisionStateIdle implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly ow: OverwolfService,
	) {}

	stateId = () => CurrentState.IDLE;
	onEnter = async () => {};
	onExit = async () => {};

	async performAction(action: Action): Promise<Action> {
		if (action === Action.STARTUP) {
			const inGame = await this.ow.inGame();
			if (inGame) {
				return Action.GAME_START;
			} else {
				this.log('not in game, not starting memory poll or memory reading plugin');
				return null;
			}
		} else {
			this.warn('performAction not mapped', Action[action]);
		}
	}

	apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset'> {
		this.error('not able to call API');
		return null;
	}

	private error(...args: any[]) {
		console.error('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}

	private warn(...args: any[]) {
		console.warn('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}

	private log(...args: any[]) {
		console.log('[mind-vision]', `[${CurrentState[this.stateId()].toLowerCase()}-state]`, ...args);
	}
}
