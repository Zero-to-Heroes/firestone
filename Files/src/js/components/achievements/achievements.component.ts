import { Component, NgZone, AfterViewInit } from '@angular/core';

import { Events } from '../../services/events.service';
import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;
declare var ga: any;
declare var adsReady: any;
declare var OwAd: any;

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="achievements">
			<section class="main">
				<achievements-menu
					[displayType]="_menuDisplayType"
					[selectedCategory]="_selectedCategory">
				</achievements-menu>
				<ng-container [ngSwitch]="_selectedView">
					<achievements-categories *ngSwitchCase="'categories'"></achievements-categories>
					<!--<achievements-list *ngSwitchCase="'list'" [achievementsList]="_achievementsList" [category]="_selectedCategory"></achievements-list>-->
				</ng-container>
			</section>
			<section class="secondary">
				<div class="ads-container">
					<div class="no-ads-placeholder">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder"/>
							</svg>
						</i>
					</div>
					<div class="ads" id="ad-div-achievements"></div>
				</div>
			</section>
		</div>
	`,
})
// 7.1.1.17994
export class AchievementsComponent {

	_menuDisplayType = 'menu';
	_selectedView = 'categories';
	_selectedCategory: AchievementSet;

	private _achievementsList: CompletedAchievement[];
	private windowId: string;
	private adRef;

	constructor(
		private _events: Events,
		private ngZone: NgZone) {
		ga('send', 'event', 'achievements', 'show');

		console.error('TODO; remove ads when switching between collection and achievements');

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			console.log('state changed in achievements', message);
			if (message.window_state != 'normal') {
				console.log('removing ad', message.window_state);
				this.adRef.removeAd();
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
			}
		});

		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.windowId = result.window.id;
			}
		});

		this.loadAds();
	}

	private loadAds() {
		if (!adsReady || !document.getElementById("ad-div-achievements")) {
			setTimeout(() => {
				this.loadAds()
			}, 50);
			return;
		}
		console.log('ads ready', adsReady);
		this.adRef = new OwAd(document.getElementById("ad-div-achievements"));
	}

	private refreshAds() {
		if (!this.adRef) {
			setTimeout(() => {
				this.refreshAds()
			}, 20);
			return;
		}
		this.adRef.refreshAd();
	}
}
