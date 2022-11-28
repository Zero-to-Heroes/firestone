import { Injectable } from '@angular/core';

export enum BgsSimulatorKeyboardControl {
	PlayerHero,
	OpponentHero,
	PlayerHeroPower,
	OpponentHeroPower,
	PlayerQuestReward,
	OpponentQuestReward,
	PlayerAddMinion,
	OpponentAddMinion,
}
@Injectable()
export class BgsSimulatorKeyboardControls {
	private static CONTROL_KEYS = Object.values(BgsSimulatorKeyboardControl)
		.filter((key) => typeof key !== 'string')
		.map((key) => key as BgsSimulatorKeyboardControl);

	private allowControl: boolean;
	private controls: {
		[key: string]: () => void | Promise<void>;
	} = {};

	public init(allowKeyboardControl: boolean): BgsSimulatorKeyboardControls {
		this.allowControl = allowKeyboardControl;
		return this;
	}

	public control(
		key: BgsSimulatorKeyboardControl,
		handler: () => void | Promise<void>,
	): BgsSimulatorKeyboardControls {
		this.controls[key] = handler;
		return this;
	}

	public handleKeyDown(event: KeyboardEvent) {
		if (!this.allowControl) {
			return;
		}

		const key = this.getKey(event);
		if (key != null && !!this.controls[key]) {
			this.controls[key]();
		}
	}

	public tearDown() {
		this.controls = {};
	}

	public static getKeyName(key: BgsSimulatorKeyboardControl): string {
		switch (key) {
			case BgsSimulatorKeyboardControl.PlayerHero:
				return 'h';
			case BgsSimulatorKeyboardControl.OpponentHero:
				return 'H';
			case BgsSimulatorKeyboardControl.PlayerHeroPower:
				return 'p';
			case BgsSimulatorKeyboardControl.OpponentHeroPower:
				return 'P';
			case BgsSimulatorKeyboardControl.PlayerQuestReward:
				return 'r';
			case BgsSimulatorKeyboardControl.OpponentQuestReward:
				return 'R';
			case BgsSimulatorKeyboardControl.PlayerAddMinion:
				return 'm';
			case BgsSimulatorKeyboardControl.OpponentAddMinion:
				return 'M';
		}
	}

	private getKey(event: KeyboardEvent): BgsSimulatorKeyboardControl {
		return BgsSimulatorKeyboardControls.CONTROL_KEYS.find(
			(key) => BgsSimulatorKeyboardControls.getKeyName(key) === event.key,
		);
	}
}
