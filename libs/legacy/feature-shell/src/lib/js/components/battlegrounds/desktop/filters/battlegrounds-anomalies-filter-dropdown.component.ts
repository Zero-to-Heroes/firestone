import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsAnomaliesService, BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { BG_USE_ANOMALIES, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { IOptionWithImage } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';

@Component({
	selector: 'battlegrounds-anomalies-filter-dropdown',
	styleUrls: [],
	template: `
		<filter-dropdown
			class="battlegrounds-anomalies-filter-dropdown"
			[options]="options"
			[filter]="currentFilter$ | async"
			[placeholder]="'app.battlegrounds.filters.anomaly.all-anomalies' | owTranslate"
			[visible]="visible$ | async"
			[showCardTooltip]="true"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsAnomaliesFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	options: IOptionWithImage[];
	currentFilter$: Observable<string>;
	visible$: Observable<boolean>;

	validationErrorTooltip = this.i18n.translateString('app.battlegrounds.filters.anomaly.validation-error-tooltip');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly nav: BattlegroundsNavigationService,
		private readonly anomalyService: BattlegroundsAnomaliesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.anomalyService, this.prefs);

		if (!BG_USE_ANOMALIES) {
			return;
		}

		const allAnomalies: readonly string[] = await this.anomalyService.loadAllAnomalies();
		this.options = [
			{
				value: null,
				label: this.i18n.translateString('app.battlegrounds.filters.anomaly.all-anomalies'),
				image: null,
			},
			...allAnomalies
				.filter((a) => !!a)
				.map((anomaly) => this.allCards.getCard(anomaly))
				.map((anomaly) => ({
					value: anomaly.id,
					label: anomaly.name,
					image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly.id}.jpg`,
				}))
				.sort(sortByProperties((o) => [o.label])),
		];
		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveAnomaliesFilter[0]));
		this.visible$ = this.nav.selectedCategoryId$$.pipe(
			filter((categoryId) => !!categoryId),
			this.mapData((categoryId) => categoryId === 'bgs-category-meta-heroes'),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(value: IOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveUseAnomalyFilterInHeroSelection: true,
			bgsActiveAnomaliesFilter: !value?.value ? [] : [value.value],
		};
		console.debug('[bgs-anomalies-filter-dropdown] setting new prefs', value, newPrefs);
		await this.prefs.savePreferences(newPrefs);
	}
}
