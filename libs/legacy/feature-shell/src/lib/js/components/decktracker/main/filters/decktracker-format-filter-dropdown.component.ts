import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { StatGameFormatType } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { ChangeDeckFormatFilterEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-format-filter-event';

@Component({
	standalone: false,
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: ConstructedNavigationService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.mainWindowStateFacade);

		this.filter$ = combineLatest([
			this.mainWindowStateFacade.mainWindowState$$.pipe(
				this.mapData((state) => state.decktracker.filters.gameFormat),
			),
			this.nav.currentView$$,
		]).pipe(
			filter(([filter, currentView]) => !!filter && !!currentView),
			this.mapData(([filter, currentView]) => {
				const options = [
					{
						value: 'all',
						label: this.i18n.translateString('app.decktracker.filters.format-filter.all-formats'),
						tooltip: this.i18n.translateString('app.decktracker.filters.format-filter.all-formats-tooltip'),
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
					{
						value: 'casual' as any,
						label: this.i18n.translateString('app.replays.filters.game-mode.casual'),
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
			this.cdr.markForCheck();
		}
	}

	onSelected(option: IOption) {
		this.mainWindowStateFacade.send(new ChangeDeckFormatFilterEvent((option as FormatFilterOption).value));
	}
}

interface FormatFilterOption extends IOption {
	value: StatGameFormatType;
}
