import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DuelsCategory } from '../../../models/mainwindow/duels/duels-category';
import { DuelsCategoryType } from '../../../models/mainwindow/duels/duels-category.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { FeatureFlags } from '../../../services/feature-flags';
import { DuelsSelectCategoryEvent } from '../../../services/mainwindow/store/events/duels/duels-select-category-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/duels/desktop/duels-desktop.component.scss`,
	],
	template: `
		<div class="app-section duels">
			<section class="main divider">
				<with-loading [isLoading]="enableDuels && (!state.duels || state.duels.loading)">
					<div class="content" *ngIf="enableDuels && state.duels">
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
							[hidden]="navigation.navigationDuels.selectedCategoryId !== 'duels-runs'"
							[state]="state.duels"
						>
						</duels-runs-list>
						<duels-hero-stats
							[hidden]="navigation.navigationDuels.selectedCategoryId !== 'duels-stats'"
							[state]="state.duels"
						>
						</duels-hero-stats>
						<duels-treasure-stats
							[hidden]="navigation.navigationDuels.selectedCategoryId !== 'duels-treasures'"
							[state]="state.duels"
						>
						</duels-treasure-stats>
						<duels-top-decks
							[hidden]="navigation.navigationDuels.selectedCategoryId !== 'duels-top-decks'"
							[state]="state.duels"
						>
						</duels-top-decks>
					</div>
				</with-loading>
			</section>
			<section class="secondary" *ngIf="enableDuels"></section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDesktopComponent implements AfterViewInit {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;

	enableDuels = FeatureFlags.ENABLE_DUELS;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildCategories(): readonly DuelsCategory[] {
		if (!this.state?.duels?.categories) {
			return [];
		}
		return this.state.duels.categories;
	}

	selectCategory(categoryId: DuelsCategoryType) {
		this.stateUpdater.next(new DuelsSelectCategoryEvent(categoryId));
	}
}
