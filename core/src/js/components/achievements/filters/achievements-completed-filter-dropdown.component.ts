import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FilterOption } from '../../../models/filter-option';
import { GenericPreferencesUpdateEvent } from '../../../services/mainwindow/store/events/generic-preferences-update-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'achievements-completed-filter-dropdown',
	styleUrls: [
		`../../../../css/global/filters.scss`,
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="achievements-completed-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsCompletedFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	filters: readonly FilterOption[];

	options$: Observable<readonly IOption[]>;
	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options$ = this.store
			.listen$(([main, nav]) => main.achievements.filters)
			.pipe(
				this.mapData(([filters]) =>
					filters.map((option) => ({
						label: option.label,
						value: option.value,
					})),
				),
			);
		this.filter$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => prefs.achievementsCompletedActiveFilter),
			this.options$,
		).pipe(
			this.mapData(([[filter], options]) => ({
				filter: filter,
				placeholder: options.find((option) => option.value === filter)?.label,
				visible: true,
			})),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				achievementsCompletedActiveFilter: option.value as any,
			})),
		);
	}
}
