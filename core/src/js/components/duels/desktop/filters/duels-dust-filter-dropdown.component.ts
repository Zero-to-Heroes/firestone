import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsTopDecksDustFilterType } from '../../../../models/duels/duels-top-decks-dust-filter.type';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { DuelsTopDecksDustFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-dust-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-dust-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-dust-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDustFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	options: readonly DustFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.options = [
			{
				value: 'all',
				label: this.i18n.translateString('app.duels.filters.dust.all'),
			} as DustFilterOption,
			{
				value: '0',
				label: this.i18n.translateString('app.duels.filters.dust.own'),
			} as DustFilterOption,
			{
				value: '40',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 40 }),
			} as DustFilterOption,
			{
				value: '100',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 100 }),
			} as DustFilterOption,
			{
				value: '200',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 200 }),
			} as DustFilterOption,
			{
				value: '500',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 500 }),
			} as DustFilterOption,
			{
				value: '1000',
				label: this.i18n.translateString('app.duels.filters.dust.dust', { value: 1000 }),
			} as DustFilterOption,
		] as readonly DustFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-top-decks'].includes(selectedCategoryId),
				})),
				// Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DustFilterOption) {
		this.stateUpdater.next(new DuelsTopDecksDustFilterSelectedEvent(option.value));
	}
}

interface DustFilterOption extends IOption {
	value: DuelsTopDecksDustFilterType;
}
