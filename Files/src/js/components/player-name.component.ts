import { Component } from '@angular/core';

import { PlayerNameService } from '../services/player-name.service';

declare var overwolf: any;

@Component({
	selector: 'player-name',
	styleUrls: [`../../css/component/player-name.component.scss`],
	template: `
		<div class="player-name" *ngIf="playerName">
			<i class="i-35 pale-theme">
				<svg class="svg-icon-fill">
					<use xlink:href="/files/assets/svg/sprite.svg#user"/>
				</svg>
			</i>
			<span>
				{{playerName}}
			</span>
		</div>
	`,
})

export class PlayerNameComponent {

	playerName: string;

	constructor(private playerNameService: PlayerNameService) {
		this.playerNameService.getPlayerName((playerName) => {
			console.log('set player name', playerName);
			this.playerName = playerName;
		})
	}
}
