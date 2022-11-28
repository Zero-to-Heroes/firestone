import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ArenaCategory } from '../../../models/mainwindow/arena/arena-category';
import { ArenaCategoryType } from '../../../models/mainwindow/arena/arena-category.type';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'arena-desktop',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/arena/desktop/arena-desktop.component.scss`,
	],
	template: `
		<div class="app-section arena" *ngIf="{ value: category$ | async } as category">
			<section class="main divider">
				<with-loading [isLoading]="loading$ | async">
					<div class="content main-content" *ngIf="{ value: menuDisplayType$ | async } as menuDisplayType">
						<global-header *ngIf="menuDisplayType.value === 'breadcrumbs'"></global-header>
						<ul class="menu-selection" *ngIf="menuDisplayType.value === 'menu'">
							<li
								*ngFor="let cat of categories$ | async; trackBy: trackByFn"
								[ngClass]="{ 'selected': cat.id === category.value?.id }"
								(mousedown)="selectCategory(cat.id)"
							>
								<span>{{ cat.name }} </span>
							</li>
						</ul>
						<arena-filters> </arena-filters>
						<arena-runs-list *ngIf="category.value?.id === 'arena-runs'"> </arena-runs-list>
					</div>
				</with-loading>
			</section>
			<section class="secondary">
				<arena-classes-recap *ngIf="category.value?.id === 'arena-runs'"></arena-classes-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDesktopComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	menuDisplayType$: Observable<string>;
	category$: Observable<ArenaCategory>;
	categories$: Observable<readonly ArenaCategory[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.loading$ = this.store
			.listen$(([main, nav]) => main.arena.loading)
			.pipe(this.mapData(([loading]) => loading));
		this.menuDisplayType$ = this.store
			.listen$(([main, nav]) => nav.navigationArena.menuDisplayType)
			.pipe(this.mapData(([menuDisplayType]) => menuDisplayType));
		this.category$ = this.store
			.listen$(
				([main, nav]) => main.arena,
				([main, nav]) => nav.navigationArena.selectedCategoryId,
			)
			.pipe(this.mapData(([arena, selectedCategoryId]) => arena.findCategory(selectedCategoryId)));
		this.categories$ = this.store
			.listen$(([main, nav]) => main.arena.categories)
			.pipe(this.mapData(([categories]) => categories ?? []));
	}

	selectCategory(categoryId: ArenaCategoryType) {
		// Only one category for now
		// this.stateUpdater.next(new ArenaSelectCategoryEvent(categoryId));
	}

	trackByFn(index: number, item: ArenaCategory) {
		return item.id;
	}
}
