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
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { StatGameFormatType } from '@firestone/stats/data-access';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckFormatFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-format-filter-dropdown',
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
export class DecktrackerFormatFilterDropdownComponent
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
		private readonly nav: ConstructedNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.filter$ = combineLatest([
			this.store.listen$(([main, nav]) => main.decktracker.filters?.gameFormat),
			this.nav.currentView$$,
		]).pipe(
			filter(([[filter], currentView]) => !!filter && !!currentView),
			this.mapData(([[filter], currentView]) => {
				const options = [
					{
						value: 'all',
						label: this.i18n.translateString('app.decktracker.filters.format-filter.all-formats'),
					} as FormatFilterOption,
					{
						value: 'standard',
						label: this.i18n.translateString('app.decktracker.filters.format-filter.standard'),
					} as FormatFilterOption,
					{
						value: 'wild',
						label: this.i18n.translateString('app.decktracker.filters.format-filter.wild'),
					} as FormatFilterOption,
					// {
					// 	value: 'classic',
					// 	label: this.i18n.translateString('app.decktracker.filters.format-filter.classic'),
					// } as FormatFilterOption,
					{
						value: 'twist',
						label: this.i18n.translateString('app.decktracker.filters.format-filter.twist'),
					} as FormatFilterOption,
					{
						value: 'tavern-brawl' as any,
						label: this.i18n.translateString('app.replays.filters.game-mode.tavern-brawl'),
					} as FormatFilterOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ![
						'deck-details',
						'constructed-deckbuilder',
						'constructed-meta-decks',
						'constructed-meta-deck-details',
						'constructed-meta-archetypes',
						'constructed-meta-archetype-details',
					].includes(currentView),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: IOption) {
		this.stateUpdater.next(new ChangeDeckFormatFilterEvent((option as FormatFilterOption).value));
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}
