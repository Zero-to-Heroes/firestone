import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
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
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="filter-dropdown"
			[options]="options"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="visible$ | async"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCardTierFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	visible$: Observable<boolean>;
	options: MultiselectOption[];
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

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

		this.options = [1, 2, 3, 4, 5, 6, 7].map((tier) => ({
			value: '' + tier,
			label: this.i18n.translateString('app.battlegrounds.filters.tier.tier', { value: tier }),
			image: `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/tavern_banner_${tier}.png`,
		}));
		this.filter$ = this.prefs.preferences$$.pipe(
			tap((prefs) => console.debug('[bgs-card-tier-filter] prefs', prefs)),
			this.mapData((prefs) => ({
				selected: prefs.bgsActiveCardsTiers?.map((a) => '' + a) ?? [],
				placeholder: this.i18n.translateString(`app.battlegrounds.filters.tier.all-tiers`),
			})),
		);
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((selectedCategoryId) => selectedCategoryId === 'bgs-category-meta-cards'),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(selected: readonly string[]) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveCardsTiers: selected.map((tier) => parseInt(tier) as BgsCardTierFilterType),
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
