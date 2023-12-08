/* eslint-disable @typescript-eslint/no-empty-function */
import { sleep } from '@firestone/shared/framework/common';
import { Action, CurrentState } from '../mind-vision-actions';
import { MindVisionFacadeService } from '../mind-vision-facade.service';
import { MindVisionState } from './_mind-vision-state';

export class MindVisionStateReset implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
	) {}

	stateId = () => CurrentState.RESET;

	async onEnter(): Promise<void> {
		this.log('onEnter, starting reset');
		// Sending the notif seemed like a good idea, but it confuses the users more than anything
		// this.notifs.notifyDebug(
		// 	this.i18n.translateString('app.internal.memory.reset-started-title'),
		// 	this.i18n.translateString('app.internal.memory.reset-started-text'),
		// 	uuid(),
		// );
		// To give time to the notification to be displayed
		// Otherwise the notification just hangs until the reset is over
		await sleep(500);
		await this.mindVision.reset();
		await sleep(500);
		this.dispatcher(Action.RESET_COMPLETE);
	}

	onExit = async () => {
		setTimeout(() => {
			// this.notifs.notifyDebug(
			// 	this.i18n.translateString('app.internal.memory.reset-complete-title'),
			// 	this.i18n.translateString('app.internal.memory.reset-complete-text'),
			// 	uuid(),
			// );
			// Give a little time for the reset to take effect (though it shouldn't be really
			// necessary)
		}, 200);
	};

	async performAction(action: Action): Promise<Action | null> {
		this.warn('performAction not mapped', Action[action]);
		return null;
	}

	async apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset' | null> {
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
