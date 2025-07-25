import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { DeckTimeFilterType } from '@models/mainwindow/decktracker/deck-time-filter.type';
import { ChangeDeckTimeFilterEvent } from '@services/mainwindow/store/events/decktracker/change-deck-time-filter-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { formatPatch } from '@services/utils';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'decktracker-time-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.patchesConfig, this.nav);

		this.filter$ = combineLatest([
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.store.listen$(([main, nav]) => main.decktracker.filters?.time),
			this.nav.currentView$$,
		]).pipe(
			filter(([patch, [filter], currentView]) => !!filter && !!patch && !!currentView),
			this.mapData(([patch, [filter], currentView]) => {
				const options = [
					{
						value: 'all-time',
						label: this.i18n.translateString('app.decktracker.filters.time-filter.all-time'),
						tooltip: this.i18n.translateString('app.global.filters.time.all-time-tooltip'),
					} as TimeFilterOption,
					{
						value: 'season-start',
						label: this.i18n.translateString('app.decktracker.filters.time-filter.season-start'),
					} as TimeFilterOption,
					{
						value: 'last-patch',
						label: this.i18n.translateString('app.global.filters.time-patch', {
							value: patch.version,
						}),
						tooltip: formatPatch(patch, this.i18n),
					} as TimeFilterOption,
					{
						value: 'past-30',
						label: this.i18n.translateString('app.decktracker.filters.time-filter.past-30'),
					} as TimeFilterOption,
					{
						value: 'past-7',
						label: this.i18n.translateString('app.decktracker.filters.time-filter.past-7'),
					} as TimeFilterOption,
					{
						value: 'past-1',
						label: this.i18n.translateString('app.decktracker.filters.time-filter.past-1'),
					} as TimeFilterOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ![
						'constructed-deckbuilder',
						'constructed-meta-decks',
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckTimeFilterEvent((option as TimeFilterOption).value));
	}
}

interface TimeFilterOption extends IOption {
	value: DeckTimeFilterType;
}
