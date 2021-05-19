import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { SelectBattlegroundsCategoryEvent } from '../../../services/mainwindow/store/events/battlegrounds/select-battlegrounds-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-desktop.component.scss`,
	],
	template: `
		<div class="app-section battlegrounds {{ category?.id }}">
			<section class="main divider">
				<with-loading [isLoading]="!state.battlegrounds || state.battlegrounds.loading">
					<div class="content main-content" *ngIf="state.battlegrounds">
						<global-header
							[navigation]="navigation"
							*ngIf="
								navigation.text && navigation?.navigationBattlegrounds.menuDisplayType === 'breadcrumbs'
							"
						></global-header>
						<ul
							class="menu-selection"
							*ngIf="navigation?.navigationBattlegrounds.menuDisplayType === 'menu'"
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
						<battlegrounds-category-details
							*ngxCacheIf="navigation.navigationBattlegrounds.currentView === 'list'"
							[category]="buildCategory()"
							[state]="state"
							[navigation]="navigation"
							[ngClass]="{ 'top': shouldDisplayFiltersAtTop() }"
						>
						</battlegrounds-category-details>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
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

	category: BattlegroundsCategory;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildCategories(): readonly BattlegroundsCategory[] {
		return this.state.battlegrounds.categories ?? [];
	}

	buildCategory(): BattlegroundsCategory {
		this.category = this.state.battlegrounds.findCategory(
			this.navigation.navigationBattlegrounds.selectedCategoryId,
		);
		return this.category;
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

	shouldDisplayFiltersAtTop(): boolean {
		const category = this.buildCategory();
		return category?.id !== 'bgs-category-personal-heroes';
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
