import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DuelsCategory } from '../../../models/mainwindow/duels/duels-category';
import { DuelsCategoryType } from '../../../models/mainwindow/duels/duels-category.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { DuelsSelectCategoryEvent } from '../../../services/mainwindow/store/events/duels/duels-select-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/duels/desktop/duels-desktop.component.scss`,
	],
	template: `
		<div class="app-section duels">
			<section class="main divider">
				<with-loading [isLoading]="!state.duels || state.duels.loading">
					<div class="content main-content" *ngIf="state.duels">
						<global-header
							[navigation]="navigation"
							*ngIf="navigation.text && navigation?.navigationDuels.menuDisplayType === 'breadcrumbs'"
						></global-header>
						<ul class="menu-selection" *ngIf="navigation?.navigationDuels.menuDisplayType === 'menu'">
							<li
								*ngFor="let category of buildCategories()"
								[ngClass]="{
									'selected': navigation?.navigationDuels?.selectedCategoryId === category.id
								}"
								(mousedown)="selectCategory(category.id)"
							>
								<span>{{ category.name }} </span>
							</li>
						</ul>
						<duels-filters [state]="state" [navigation]="navigation"> </duels-filters>
						<duels-runs-list
							*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-runs'"
							[state]="state.duels"
							[navigation]="navigation.navigationDuels"
						>
						</duels-runs-list>
						<!-- Hero stats. Different component instances to improve caching -->
						<duels-hero-stats
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-stats' &&
								state.duels?.activeStatTypeFilter === 'hero'
							"
							[state]="state.duels"
							[statType]="'hero'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<duels-hero-stats
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-stats' &&
								state.duels?.activeStatTypeFilter === 'hero-power'
							"
							[state]="state.duels"
							[statType]="'hero-power'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<duels-hero-stats
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-stats' &&
								state.duels?.activeStatTypeFilter === 'signature-treasure'
							"
							[state]="state.duels"
							[statType]="'signature-treasure'"
							[navigation]="navigation.navigationDuels"
						>
						</duels-hero-stats>
						<!-- Treasure stats. Different component instances to improve caching -->
						<duels-treasure-stats
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-treasures' &&
								['treasure-1', 'treasure-2', 'treasure-3'].includes(
									state.duels?.activeTreasureStatTypeFilter
								)
							"
							[state]="state.duels"
							[statType]="state.duels?.activeTreasureStatTypeFilter"
							[navigation]="navigation.navigationDuels"
						>
						</duels-treasure-stats>
						<duels-treasure-stats
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-treasures' &&
								['passive-1', 'passive-2', 'passive-3'].includes(
									state.duels?.activeTreasureStatTypeFilter
								)
							"
							[state]="state.duels"
							[statType]="state.duels?.activeTreasureStatTypeFilter"
							[navigation]="navigation.navigationDuels"
						>
						</duels-treasure-stats>
						<duels-personal-decks
							*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-personal-decks'"
							[state]="state.duels"
						>
						</duels-personal-decks>
						<duels-personal-deck-details
							*ngxCacheIf="
								navigation.navigationDuels.selectedCategoryId === 'duels-personal-deck-details' ||
								navigation.navigationDuels.selectedCategoryId === 'duels-deck-details'
							"
							[state]="state"
							[navigation]="navigation.navigationDuels"
						>
						</duels-personal-deck-details>
						<duels-top-decks
							*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-top-decks'"
							[state]="state.duels"
						>
						</duels-top-decks>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<duels-hero-search
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-stats'"
					[navigation]="navigation.navigationDuels"
				></duels-hero-search>
				<duels-treasure-search
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-treasures'"
					[navigation]="navigation.navigationDuels"
				></duels-treasure-search>

				<duels-classes-recap
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-runs'"
					[state]="state.duels"
				></duels-classes-recap>
				<duels-replays-recap
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-personal-decks'"
					[state]="state"
				></duels-replays-recap>
				<duels-treasure-tier-list
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-treasures'"
					[state]="state.duels"
				></duels-treasure-tier-list>
				<duels-hero-tier-list
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-stats'"
					[state]="state.duels"
				></duels-hero-tier-list>
				<duels-deck-stats
					*ngxCacheIf="
						navigation.navigationDuels.selectedCategoryId === 'duels-personal-deck-details' ||
						navigation.navigationDuels.selectedCategoryId === 'duels-deck-details'
					"
					[state]="state.duels"
					[navigation]="navigation.navigationDuels"
				></duels-deck-stats>
				<secondary-default
					*ngxCacheIf="navigation.navigationDuels.selectedCategoryId === 'duels-top-decks'"
				></secondary-default>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDesktopComponent implements AfterViewInit {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildCategories(): readonly DuelsCategory[] {
		return this.state?.duels?.categories ?? [];
	}

	selectCategory(categoryId: DuelsCategoryType) {
		this.stateUpdater.next(new DuelsSelectCategoryEvent(categoryId));
	}
}
