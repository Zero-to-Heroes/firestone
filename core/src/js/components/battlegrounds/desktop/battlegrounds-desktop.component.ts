import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsAppState } from '../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { FeatureFlags } from '../../../services/feature-flags';
import { SelectBattlegroundsCategoryEvent } from '../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-desktop.component.scss`,
	],
	template: `
		<div class="app-section battlegrounds">
			<section class="main divider">
				<with-loading [isLoading]="enableBg && (!state.battlegrounds || state.battlegrounds.loading)">
					<div class="content empty-state" *ngIf="!enableBg">
						<i>
							<svg>
								<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
							</svg>
						</i>
						<span class="title">Battlegrounds in-game app is now live! </span>
						<span class="subtitle"
							>Our new Battlegrounds in-game feature is now available and will appear once you start a
							match! It uses your second screen (if you have one) for a better experience and can be
							easily controlled with hotkeys (Alt + B by default)</span
						>
						<span class="subtitle"
							>Coming soon: personal stats and the ability to review all past match stats!</span
						>
					</div>
					<div class="content" *ngIf="enableBg && state.battlegrounds">
						<global-header
							[navigation]="navigation"
							*ngIf="
								navigation.text && navigation?.navigationBattlegrounds.menuDisplayType === 'breadcrumbs'
							"
						></global-header>
						<ul
							class="menu-selection"
							*ngIf="!navigation?.text && navigation?.navigationBattlegrounds.menuDisplayType === 'menu'"
						>
							<li
								*ngFor="let category of buildCategories()"
								[ngClass]="{
									'selected': navigation?.navigationBattlegrounds?.selectedCategoryId === category.id
								}"
								(mousedown)="selectCategory(category.id)"
							>
								<span>{{ category.name }} </span>
							</li>
						</ul>
						<battlegrounds-filters [state]="state" [navigation]="navigation"> </battlegrounds-filters>
						<!-- <battlegrounds-global-categories
							[hidden]="navigation.navigationBattlegrounds.currentView !== 'categories'"
							[globalCategories]="state.battlegrounds.globalCategories"
						>
						</battlegrounds-global-categories> -->
						<!-- <battlegrounds-categories
							[hidden]="navigation.navigationBattlegrounds.currentView !== 'category'"
							[categories]="buildCategories()"
						>
						</battlegrounds-categories> -->
						<battlegrounds-category-details
							[hidden]="navigation.navigationBattlegrounds.currentView !== 'list'"
							[category]="buildCategory()"
							[state]="state"
							[navigation]="navigation"
						>
						</battlegrounds-category-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="enableBg">
				<battlegrounds-tier-list
					*ngIf="shouldDisplayHeroTierList()"
					[category]="buildCategory()"
					[state]="state"
				></battlegrounds-tier-list>
				<battlegrounds-heroes-records-broken
					*ngIf="shouldDisplayRecordBrokenHeroes()"
					[category]="buildCategory()"
					[state]="state"
				></battlegrounds-heroes-records-broken>
				<battlegrounds-replays-recap
					*ngIf="shouldDisplayReplaysRecap()"
					[category]="buildCategory()"
					[state]="state"
					[numberOfReplays]="numberOfReplaysToShow()"
					[heroCardId]="heroFilterForReplays()"
				></battlegrounds-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsDesktopComponent implements AfterViewInit {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;

	enableBg = FeatureFlags.ENABLE_BG_DESKTOP;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildCategories(): readonly BattlegroundsCategory[] {
		return (
			this.state.battlegrounds.globalCategories.find(
				cat => cat.id === this.navigation.navigationBattlegrounds.selectedGlobalCategoryId,
			)?.categories || []
		);
	}

	buildCategory(): BattlegroundsCategory {
		return BattlegroundsAppState.findCategory(
			this.state.battlegrounds,
			this.navigation.navigationBattlegrounds.selectedCategoryId,
		);
	}

	shouldDisplayHeroTierList(): boolean {
		const category = this.buildCategory();
		return category?.id === 'bgs-category-personal-heroes';
	}

	shouldDisplayRecordBrokenHeroes(): boolean {
		const category = this.buildCategory();
		return category?.id === 'bgs-category-personal-stats';
	}

	shouldDisplayReplaysRecap(): boolean {
		const category = this.buildCategory();
		return (
			category?.id === 'bgs-category-personal-rating' ||
			category?.id?.includes('bgs-category-personal-hero-details-')
		);
	}

	numberOfReplaysToShow(): number {
		return 10;
	}

	heroFilterForReplays(): string {
		const category = this.buildCategory();
		if (category?.id?.includes('bgs-category-personal-hero-details-')) {
			return (category as BattlegroundsPersonalStatsHeroDetailsCategory).heroId;
		}
		return null;
	}

	selectCategory(categoryId: string) {
		this.stateUpdater.next(new SelectBattlegroundsCategoryEvent(categoryId));
	}
}
