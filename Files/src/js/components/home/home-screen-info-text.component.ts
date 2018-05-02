import { Component, NgZone, OnInit } from '@angular/core';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Component({
	selector: 'home-screen-info-text',
	styleUrls: [`../../../css/component/home/home-screen-info-text.component.scss`],
	template: `
		<div class="home-screen-info">
			<div class="hearthlore">
				<i class="i-35 gold-theme left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
				<span class="title">Welcome to Hearthlore</span>
				<i class="i-35 gold-theme right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
			</div>
			<span class="sub-title" [innerHTML]="status"></span>
		</div>
	`,
})

export class HomeScreenInfoTextComponent implements OnInit {

	private status;

	ngOnInit() {
		overwolf.games.getRunningGameInfo((res: any) => {
			console.log('detecting running game in welcome window', res);
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				this.status = "Hearthlore now follows your Hearthtsone session. <br /> Choose an ability:";
			}
			else {
				this.status = "No Hearthstone session detected: <br /> Choose an ability:";
			}
		});
	}
}
