/* eslint-disable @typescript-eslint/no-empty-function */
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OwNotificationsService } from '@services/notifications.service';
import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';
import { MindVisionFacadeService } from '@services/plugins/mind-vision/mind-vision-facade.service';
import { MindVisionState } from '@services/plugins/mind-vision/states/_mind-vision-state';
import { sleep, uuid } from '@services/utils';

export class MindVisionStateReset implements MindVisionState {
	constructor(
		private readonly mindVision: MindVisionFacadeService,
		private readonly dispatcher: (action: Action) => Promise<void>,
		private readonly notifs: OwNotificationsService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	stateId = () => CurrentState.RESET;

	async onEnter(): Promise<void> {
		this.log('onEnter, starting reset');
		this.notifs.notifyError(
			this.i18n.translateString('app.internal.memory.reset-started-title'),
			this.i18n.translateString('app.internal.memory.reset-started-text'),
			uuid(),
		);
		// To give time to the notification to be displayed
		// Otherwise the notification just hangs until the reset is over
		await sleep(500);
		await this.mindVision.reset();
		await sleep(500);
		this.dispatcher(Action.RESET_COMPLETE);
	}

	onExit = async () => {
		setTimeout(() => {
			this.notifs.notifyError(
				this.i18n.translateString('app.internal.memory.reset-complete-title'),
				this.i18n.translateString('app.internal.memory.reset-complete-text'),
				uuid(),
			);
			// Give a little time for the reset to take effect (though it shouldn't be really
			// necessary)
		}, 200);
	};

	async performAction(action: Action): Promise<Action> {
		this.warn('performAction not mapped', Action[action]);
		return null;
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
