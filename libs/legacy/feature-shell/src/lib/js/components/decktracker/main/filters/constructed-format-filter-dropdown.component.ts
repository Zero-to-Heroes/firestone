import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { GenericPreferencesUpdateEvent } from '../../../../services/mainwindow/store/events/generic-preferences-update-event';

@Component({
	standalone: false,
	selector: 'constructed-format-filter-dropdown',
	styleUrls: [
		`../../../../../css/component/decktracker/main/filters/decktracker-rank-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			class="filter"
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
export class ConstructedFormatFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ConstructedNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.filter$ = combineLatest([
			this.nav.currentView$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedMetaDecksFormatFilter)),
		]).pipe(
			filter(([currentView, filter]) => !!currentView),
			this.mapData(([currentView, filter]) => {
				const options: FilterOption[] = ['standard', 'wild', 'twist'].map(
					(option) =>
						({
							value: option,
							label: this.i18n.translateString(`global.format.${option}`),
						}) as FilterOption,
				);
				return {
					filter: filter,
					options: options,
					placeholder: options.find((option) => option.value === filter)?.label,
					visible: ['constructed-meta-decks', 'constructed-meta-archetypes'].includes(currentView),
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
		this.stateUpdater.next(
			new GenericPreferencesUpdateEvent((prefs) => ({
				...prefs,
				constructedMetaDecksFormatFilter: (option as FilterOption).value,
			})),
		);
	}
}

interface FilterOption extends IOption {
	value: GameFormat;
}
