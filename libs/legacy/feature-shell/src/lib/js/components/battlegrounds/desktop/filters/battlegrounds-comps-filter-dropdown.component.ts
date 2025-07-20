import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import {
	BattlegroundsNavigationService,
	BgsMetaCompositionStrategiesService,
	CategoryId,
} from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { MultiselectOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'battlegrounds-comps-filter-dropdown',
	styleUrls: ['./battlegrounds-comps-filter-dropdown.component.scss'],
	template: `
		<filter-dropdown-multiselect
			*ngIf="filter$ | async as value"
			class="filter-dropdown"
			[options]="options$ | async"
			[selected]="value.selected"
			[placeholder]="value.placeholder"
			[visible]="visible$ | async"
			(optionSelected)="onSelected($event)"
		></filter-dropdown-multiselect>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCompsFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	visible$: Observable<boolean>;
	options$: Observable<MultiselectOption[]>;
	filter$: Observable<{ selected: readonly string[]; placeholder: string }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly comps: BgsMetaCompositionStrategiesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.prefs, this.comps);

		this.options$ = this.comps.strategies$$.pipe(
			this.mapData((comps) =>
				comps.map((comp) => ({
					value: comp.compId,
					label: comp.name,
					image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${
						comp.cards.find((c) => c.status === 'CORE')?.cardId
					}.jpg`,
				})),
			),
		);
		this.filter$ = this.prefs.preferences$$.pipe(
			tap((prefs) => console.debug('[bgs-comps-filter] prefs', prefs)),
			this.mapData((prefs) => ({
				selected: prefs.bgsActiveCompsFilter?.map((a) => '' + a) ?? [],
				placeholder: this.i18n.translateString(`app.battlegrounds.filters.comps.all-comps`),
			})),
		);
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((selectedCategoryId: CategoryId) => selectedCategoryId === 'bgs-category-perfect-games'),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(selected: readonly string[]) {
		this.prefs.updatePrefs('bgsActiveCompsFilter', selected);
	}
}
