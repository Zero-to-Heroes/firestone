import { Injectable } from '@angular/core';


declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class GameEventsPluginService {

	private gameEventsPlugin: any;
	initialized: boolean = false;

	constructor() {
		this.initialized = false;
		let gameEventsPlugin = this.gameEventsPlugin = new OverwolfPlugin("overwolf-replay-converter", true);
		gameEventsPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.error("[game-events] Plugin couldn't be loaded??");
				return;
			}
			console.log("[game-events] Plugin " + gameEventsPlugin.get()._PluginName_ + " was loaded!");
			this.initialized = true;
		});
	}

	public async get() {
		await this.waitForInit();
		return this.gameEventsPlugin.get();
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				// console.log('Promise waiting for db');
				if (this.initialized) {
					// console.log('wait for db init complete');
					resolve();
				} 
				else {
					// console.log('waiting for db init');
					setTimeout(() => dbWait(), 50);
				}
			}
			dbWait();
		});
	}
}
