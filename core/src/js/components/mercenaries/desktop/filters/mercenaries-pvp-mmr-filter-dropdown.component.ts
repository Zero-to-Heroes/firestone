import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { MercenariesPvpMmrFilterSelectedEvent } from '../../../../services/mainwindow/store/events/mercenaries/mercenaries-pvp-mmr-filter-selected-event';
import { MmrPercentile } from '../../../../services/mercenaries/mercenaries-state-builder.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-pvp-mmr-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="mercenaries-pvp-mmr-filter-dropdown"
			[options]="options$ | async"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPvpMmrFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	options$: Observable<readonly FilterOption[]>;

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.options$ = this.store
			.listen$(([main, nav, prefs]) => main.mercenaries.getGlobalStats()?.pvp?.mmrPercentiles)
			.pipe(
				filter(([mmrPercentiles]) => !!mmrPercentiles?.length),
				this.mapData(([mmrPercentiles]) =>
					mmrPercentiles.map(
						(percentile) =>
							({
								value: '' + percentile.percentile,
								label: this.buildPercentileLabel(percentile),
							} as FilterOption),
					),
				),
			);
		this.filter$ = combineLatest(
			this.options$,
			this.store.listen$(
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesActiveModeFilter,
				([main, nav]) => nav.navigationMercenaries.selectedCategoryId,
			),
		).pipe(
			filter(
				([options, [filter, modeFilter, selectedCategoryId]]) =>
					!!options?.length && !!filter && !!selectedCategoryId,
			),
			this.mapData(([options, [filter, modeFilter, selectedCategoryId]]) => ({
				filter: '' + filter,
				placeholder: options.find((option) => option.value === '' + filter)?.label ?? options[0].label,
				visible:
					selectedCategoryId === 'mercenaries-my-teams' ||
					selectedCategoryId === 'mercenaries-hero-stats' ||
					selectedCategoryId === 'mercenaries-compositions-stats' ||
					(modeFilter === 'pvp' &&
						(selectedCategoryId === 'mercenaries-personal-hero-stats' ||
							selectedCategoryId === 'mercenaries-meta-hero-details' ||
							selectedCategoryId === 'mercenaries-composition-details')),
			})),
		);
	}

	onSelected(option: FilterOption) {
		this.store.send(new MercenariesPvpMmrFilterSelectedEvent(+option.value as any));
	}

	private buildPercentileLabel(percentile: MmrPercentile): string {
		switch (percentile.percentile) {
			case 100:
				return this.i18n.translateString('app.battlegrounds.filters.rank.all');
			case 50:
			case 25:
			case 10:
				return this.i18n.translateString('app.battlegrounds.filters.rank.percentile', {
					percentile: percentile.percentile,
					mmr: this.getNiceMmrValue(percentile.mmr, 2),
				});
			case 1:
				return this.i18n.translateString('app.battlegrounds.filters.rank.percentile', {
					percentile: percentile.percentile,
					mmr: this.getNiceMmrValue(percentile.mmr, 1),
				});
		}
	}

	private getNiceMmrValue(mmr: number, significantDigit: number) {
		return Math.pow(10, significantDigit) * Math.round(mmr / Math.pow(10, significantDigit));
	}
}

interface FilterOption extends IOption {
	value: string; // Actually a number that describes the percentile (100, 50, 1, etc.)
}
