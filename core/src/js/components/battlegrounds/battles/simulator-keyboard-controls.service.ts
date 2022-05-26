import { Injectable } from '@angular/core';

@Injectable()
export class BgsSimulatorKeyboardControls {
	private allowControl: boolean;
	private controls: {
		[key: string]: () => void | Promise<void>;
	} = {};

	public init(allowKeyboardControl: boolean): BgsSimulatorKeyboardControls {
		this.allowControl = allowKeyboardControl;
		return this;
	}

	public control(key: BgsSimulatorKeyboardControl, handler: () => void | Promise<void>) {
		console.debug('registering control', key, handler, this.allowControl);
		this.controls[key] = handler;
	}

	public handleKeyDown(event: KeyboardEvent) {
		if (!this.allowControl) {
			return;
		}

		const key = this.getKey(event);
		console.debug('retrieved key', key, event, this.controls);
		if (key != null && !!this.controls[key]) {
			this.controls[key]();
		}
	}

	public tearDown() {
		this.controls = {};
	}

	private getKey(event: KeyboardEvent): BgsSimulatorKeyboardControl {
		// Opponnet
		if (event.key === 'H') {
			return BgsSimulatorKeyboardControl.OpponentHero;
		}
		return null;
	}
}

export enum BgsSimulatorKeyboardControl {
	OpponentHero,
}
