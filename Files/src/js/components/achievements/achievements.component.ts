import { Component, ViewRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { timeInterval } from 'rxjs/operator/timeInterval';

import { Events } from '../../services/events.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { CompletedAchievement } from '../../models/completed-achievement';
import { AchievementSet } from '../../models/achievement-set';
import { Achievement } from '../../models/achievement';
import { VisualAchievement } from '../../models/visual-achievement';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';

const ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS = 150;

declare var overwolf: any;
declare var ga: any;
declare var adsReady: any;
declare var OwAd: any;
declare var _: any;

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="achievements">
			<section class="main" [@viewState]="_viewState">
				<ng-container [ngSwitch]="_selectedView">
					<achievements-categories
							*ngSwitchCase="'categories'"
							[achievementSets]="achievementCategories">
					</achievements-categories>
					<achievements-list
							*ngSwitchCase="'list'"
							[achievementsList]="_achievementsList"
							[achievementSet]="_selectedCategory">
					</achievements-list>
				</ng-container>
			</section>
			<section class="secondary">
				<achievement-history></achievement-history>
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
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('viewState', [
			state('hidden',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('shown',	style({
				opacity: 1,
			})),
			transition(
				'hidden <=> shown',
				animate(`${ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS}ms linear`)),
		])
	],
})
// 7.1.1.17994
export class AchievementsComponent implements AfterViewInit {

	_menuDisplayType = 'menu';
	_selectedView = 'categories';
	_selectedCategory: AchievementSet;
	_achievementsList: ReadonlyArray<VisualAchievement>;
	achievementCategories: AchievementSet[];
	_viewState = 'shown';

	private windowId: string;
	private adRef;
	private refreshingContent = false;

	constructor(
		private _events: Events,
		private repository: AchievementsRepository,
		private cdr: ChangeDetectorRef) {
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
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
			}
			else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
				this.refreshContents();
			}
		});

		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				this.windowId = result.window.id;
			}
		});

		// console.log('constructing');
		this._events.on(Events.ACHIEVEMENT_SET_SELECTED).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					// console.log(`selecting set, showing cards`, data);
					this._menuDisplayType = 'breadcrumbs';
					this._selectedView = 'list';
					this._selectedCategory = data.data[0];
					this._achievementsList = this._selectedCategory.achievements;
				});
			}
		)

		this._events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				this.transitionState(() => {
					this.reset();
					this._menuDisplayType = 'menu';
					this._selectedView = 'categories';
					this.refreshContents();
				});
			}
		)
		this.loadAds();
		this.refreshContents();
	}

	ngAfterViewInit() {
		this.cdr.detach();
	}

	refreshContents() {
		if (this.refreshingContent) {
			return;
		}
		console.log('refreshing contents');
		this.refreshingContent = true;
		this.repository.loadAggregatedAchievements()
			.then((achievementSets: AchievementSet[]) => {
				console.log('[achievements.component.ts] loaded all achievement Sets', achievementSets);
				this.achievementCategories = achievementSets;
				this.refreshingContent = false;
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	private transitionState(changeStateCallback: Function) {
		this._viewState = "hidden";
		setTimeout(() => {
			changeStateCallback();
			this._viewState = "shown";
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}, ACHIEVEMENTS_HIDE_TRANSITION_DURATION_IN_MS);
	}

	private reset() {
		this._menuDisplayType = undefined;
		this._selectedView = undefined;
		this._selectedCategory = undefined;
		this._achievementsList = undefined;
		this.achievementCategories = undefined;
	}

	private loadAds() {
		// if (!adsReady || !document.getElementById("ad-div-achievements")) {
		// 	setTimeout(() => {
		// 		this.loadAds()
		// 	}, 50);
		// 	return;
		// }
		// console.log('ads ready', adsReady);
		// this.adRef = new OwAd(document.getElementById("ad-div-achievements"));
	}

	private refreshAds() {
		// if (!this.adRef) {
		// 	setTimeout(() => {
		// 		this.refreshAds()
		// 	}, 20);
		// 	return;
		// }
		// this.adRef.refreshAd();
	}
}
