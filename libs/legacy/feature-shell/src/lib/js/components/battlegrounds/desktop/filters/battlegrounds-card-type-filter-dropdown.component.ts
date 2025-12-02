import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BgsCardTypeFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-type-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-card-type-filter-dropdown-view
			class="battlegrounds-card-turn-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-type-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTypeFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	currentFilter$: Observable<BgsCardTypeFilterType>;
	visible$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsCardType));
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			filter((selectedCategoryId) => !!selectedCategoryId),
			this.mapData((selectedCategoryId) => ['bgs-category-meta-cards'].includes(selectedCategoryId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(value: BgsCardTypeFilterType) {
		this.prefs.updatePrefs('bgsActiveCardsCardType', value);
	}
}
