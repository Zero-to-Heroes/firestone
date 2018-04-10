import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

import { MemoryInspectionService } from './plugins/memory-inspection.service';
import { LocalStorageService } from 'angular-2-local-storage';

declare var OverwolfPlugin: any;
declare var overwolf: any;

@Injectable()
export class PlayerNameService {

	plugin: any;
	mindvisionPlugin: any;

	constructor(private mindVision: MemoryInspectionService, private localStorageService: LocalStorageService) {
	}

	public getPlayerName(callback: Function) {
		this.mindVision.getBattleTag((battleTag) => {
			console.log('retrieved battle tag from memory', battleTag);
			if (!battleTag) {
				console.log('Loading player name from db', this.localStorageService.get('playerName'));
				callback(this.localStorageService.get('playerName'));
			}
			else {
				let playerName = battleTag.Name;
				this.localStorageService.set('playerName', playerName);
				console.log('saving player name', playerName);
				callback(playerName);
			}
		})
	}
}
