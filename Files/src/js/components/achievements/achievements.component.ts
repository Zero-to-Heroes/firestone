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
declare var _: any;

@Component({
	selector: 'achievements',
	styleUrls: [
		`../../../css/component/achievements/achievements.component.scss`,
	],
	template: `
		<div class="achievements">
			<section class="main" [ngClass]="{'divider': _selectedView == 'list'}" [@viewState]="_viewState">
				<achievements-menu 
					[ngClass]="{'shrink': hideMenu}"
					[displayType]="_menuDisplayType"
					[selectedAchievementSet]="_selectedCategory">
				</achievements-menu>
				<ng-container [ngSwitch]="_selectedView">
					<achievements-categories
							*ngSwitchCase="'categories'"
							[achievementSets]="achievementCategories">
					</achievements-categories>
					<achievements-list
							*ngSwitchCase="'list'"
							(shortDisplay)="onShortDisplay($event)"
							[achievementsList]="_achievementsList"
							[achievementIdToScrollIntoView]="achievementIdToScrollIntoView"
							[achievementSet]="_selectedCategory">
					</achievements-list>
				</ng-container>
			</section>
			<section class="secondary">
				<achievement-history></achievement-history>
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
	hideMenu: boolean;
	achievementIdToScrollIntoView: string;

	private windowId: string;
	private refreshingContent = false;

	constructor(
		private _events: Events,
		private repository: AchievementsRepository,
		private cdr: ChangeDetectorRef) {
		ga('send', 'event', 'achievements', 'show');

		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			// console.log('state changed in achievements', message);
			if (message.window_state == 'normal') {
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
					this._events.broadcast(Events.MODULE_IN_VIEW, 'achievements');
				});
			}
		)

		this._events.on(Events.MODULE_SELECTED).subscribe(
			(data) => {
				if (data.data[0] === 'achievements') {
					this.transitionState(() => {
						this._menuDisplayType = 'menu';
						this._selectedView = 'categories';
						this.refreshContents();
						console.log('reset achievements to categories view');
					});
				}
			}
		);

		this._events.on(Events.ACHIEVEMENT_UPDATED).subscribe(
			(data) => {
				this.reloadAchievement(data.data[0]);
			}
		)
		this.refreshContents();
	}

	public async selectAchievement(achievementId: string) {
		this.reset();
		console.log('selecting achievement', achievementId);
		const achievementSet: AchievementSet = await this.repository.findCategoryForAchievement(achievementId);
		console.log('achievement found', achievementSet);
		// this.refreshContents();
		this._menuDisplayType = 'breadcrumbs';
		this._selectedView = 'list';
		this._selectedCategory = achievementSet;
		this._achievementsList = this._selectedCategory.achievements;
		this.achievementIdToScrollIntoView = achievementId;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
			this._events.broadcast(Events.MODULE_IN_VIEW, 'achievements');
		}
	}

	public async reloadAchievement(achievementId: string) {
		console.log('reloading achievement?', achievementId);
		const achievementSet: AchievementSet = await this.repository.findCategoryForAchievement(achievementId);
		// If we're displaying the achievement set, we refresh it
		if (!this._selectedCategory || achievementSet.id === this._selectedCategory.id) {
			this._selectedCategory = achievementSet;
			console.log('reloaded set');
			if (!this._selectedView || this._selectedView === 'list') {
				console.log('reloaded achievments list');
				this._achievementsList = this._selectedCategory.achievements;
				if (!(<ViewRef>this.cdr).destroyed) {
					this.cdr.detectChanges();
				}
			}
		}		
	}

	ngAfterViewInit() {
		this.cdr.detach();
	}

	async refreshContents() {
		if (this.refreshingContent) {
			return;
		}
		console.log('refreshing contents in achievements');
		this.refreshingContent = true;
		const achievementSets: AchievementSet[] = await this.repository.loadAggregatedAchievements();
		console.log('[achievements.component.ts] loaded all achievement Sets', achievementSets);
		this.achievementCategories = achievementSets;
		this.refreshingContent = false;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onShortDisplay(shrink: boolean) {
		this.hideMenu = shrink;
		this.cdr.detectChanges();
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
}
