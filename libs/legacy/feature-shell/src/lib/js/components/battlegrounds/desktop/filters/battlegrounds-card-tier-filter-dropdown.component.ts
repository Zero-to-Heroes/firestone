import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { BgsCardTierFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-tier-filter-dropdown',
	styleUrls: ['./battlegrounds-card-tier-filter-dropdown.component.scss'],
	template: `
		<battlegrounds-card-tier-filter-dropdown-view
			class="battlegrounds-card-tier-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-tier-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTierFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	visible$: Observable<boolean>;
	currentFilter$: Observable<readonly BgsCardTierFilterType[] | null>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTiers));
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((selectedCategoryId) => selectedCategoryId === 'bgs-category-meta-cards'),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	async onSelected(selected: readonly BgsCardTierFilterType[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveCardsTiers: selected,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
