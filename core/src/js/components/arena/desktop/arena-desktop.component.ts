import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { ArenaCategory } from '../../../models/mainwindow/arena/arena-category';
import { ArenaCategoryType } from '../../../models/mainwindow/arena/arena-category.type';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'arena-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/arena/desktop/arena-desktop.component.scss`,
	],
	template: `
		<div class="app-section arena">
			<section class="main divider">
				<with-loading [isLoading]="!state.arena || state.arena.loading">
					<div class="content main-content" *ngIf="state.arena">
						<global-header
							[navigation]="navigation"
							*ngIf="navigation.text && navigation?.navigationArena.menuDisplayType === 'breadcrumbs'"
						></global-header>
						<ul class="menu-selection" *ngIf="navigation?.navigationArena.menuDisplayType === 'menu'">
							<li
								*ngFor="let category of buildCategories()"
								[ngClass]="{
									'selected': navigation?.navigationArena?.selectedCategoryId === category.id
								}"
								(mousedown)="selectCategory(category.id)"
							>
								<span>{{ category.name }} </span>
							</li>
						</ul>
						<!-- <arena-filters [state]="state" [navigation]="navigation"> </arena-filters> -->
						<arena-runs-list
							*ngxCacheIf="navigation.navigationArena.selectedCategoryId === 'arena-runs'"
							[state]="state"
							[navigation]="navigation.navigationArena"
						>
						</arena-runs-list>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<arena-classes-recap
					*ngxCacheIf="navigation.navigationArena.selectedCategoryId === 'arena-runs'"
					[state]="state.stats"
				></arena-classes-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDesktopComponent implements AfterViewInit {
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildCategories(): readonly ArenaCategory[] {
		return this.state?.arena?.categories ?? [];
	}

	selectCategory(categoryId: ArenaCategoryType) {
		// Only one category for now
		// this.stateUpdater.next(new ArenaSelectCategoryEvent(categoryId));
	}
}
