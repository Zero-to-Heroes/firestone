import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { TimeFilterOption } from '@firestone/battlegrounds/view';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { IOption } from 'ng-select';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-time-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { formatPatch } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-time-filter-dropdown',
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
export class BattlegroundsTimeFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: IOption[]; visible: boolean }>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
		private readonly prefs: PreferencesService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs, this.patchesConfig);

		this.filter$ = combineLatest([
			this.patchesConfig.currentBattlegroundsMetaPatch$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveTimeFilter)),
			this.nav.selectedCategoryId$$,
			this.store.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView),
		]).pipe(
			filter(([patch, filter, selectedCategoryId, [currentView]]) => !!filter && !!patch),
			this.mapData(([patch, filter, selectedCategoryId, [currentView]]) => {
				const options: TimeFilterOption[] = [
					{
						value: 'all-time',
						label: ['bgs-category-your-stats'].includes(selectedCategoryId)
							? this.i18n.translateString('app.battlegrounds.filters.time.all-time')
							: this.i18n.translateString('app.battlegrounds.filters.time.past-30'),
					} as TimeFilterOption,
					{
						value: 'last-patch',
						label: this.i18n.translateString('app.global.filters.time-patch', {
							value: patch.version,
						}),
						tooltip: formatPatch(patch, this.i18n),
					} as TimeFilterOption,
					{
						value: 'past-seven',
						label: this.i18n.translateString('app.battlegrounds.filters.time.past-seven'),
					} as TimeFilterOption,
					{
						value: 'past-three',
						label: this.i18n.translateString('app.battlegrounds.filters.time.past-three'),
					} as TimeFilterOption,
				];
				return {
					filter: filter,
					options: options,
					placeholder:
						options.find((option) => option.value === filter)?.label ??
						this.i18n.translateString('app.battlegrounds.filters.time.past-30'),
					visible:
						!['categories', 'category'].includes(currentView) &&
						[
							'bgs-category-your-stats',
							'bgs-category-personal-heroes',
							'bgs-category-meta-heroes',
							'bgs-category-meta-quests',
							'bgs-category-meta-trinkets',
							'bgs-category-meta-cards',
							'bgs-category-personal-quests',
							'bgs-category-personal-hero-details',
							'bgs-category-personal-rating',
						].includes(selectedCategoryId),
				};
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSelected(option: IOption) {
		this.store.send(new BgsTimeFilterSelectedEvent((option as TimeFilterOption).value));
	}
}
