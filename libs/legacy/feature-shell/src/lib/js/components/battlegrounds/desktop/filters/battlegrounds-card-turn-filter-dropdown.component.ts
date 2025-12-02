import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { CardTurnFilterOption } from '@firestone/battlegrounds/view';

@Component({
	standalone: false,
	selector: 'battlegrounds-card-turn-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-card-turn-filter-dropdown-view
			class="battlegrounds-card-turn-filter-dropdown"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></battlegrounds-card-turn-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTurnFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	currentFilter$: Observable<number>;
	visible$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs);

		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveCardsTurn));
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			filter((selectedCategoryId) => !!selectedCategoryId),
			this.mapData((selectedCategoryId) => ['bgs-category-meta-cards'].includes(selectedCategoryId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: CardTurnFilterOption) {
		this.prefs.updatePrefs('bgsActiveCardsTurn', option.value == null ? null : +option.value);
	}
}
