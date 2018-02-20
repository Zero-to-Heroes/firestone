import { Injectable } from '@angular/core';

// import * as Raven from 'raven-js';

import { DungeonInfo } from '../../models/dungeon-info'

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class SimpleIOService {
	simpleIOPlugin: any;

	constructor() {
		console.log("loading simple-io-plugin-zip");
		this.simpleIOPlugin = new OverwolfPlugin("simple-io-plugin-zip", true);
		this.simpleIOPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("Plugin simple-io-plugin-zip couldn't be loaded");
				return;
			}
			console.log("Plugin " + this.simpleIOPlugin.get()._PluginName_ + " was loaded!", this.simpleIOPlugin.get());
			this.simpleIOPlugin.get().onGlobalEvent.addListener(function(first, second) {
				console.log('received global event simple-io-plugin-zip', first, second);
			});
		});
	}

	public get() {
		return this.simpleIOPlugin.get();
	}
}
