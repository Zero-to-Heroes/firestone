import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeHeroPowerFilter } from '../+state/website/duels.actions';
import { WebsiteDuelsState } from '../+state/website/duels.models';
import { getCurrentHeroFilter, getCurrentHeroPowerFilter } from '../+state/website/duels.selectors';

@Component({
	selector: 'website-duels-hero-power-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-main-filter-multiselect-dropdown-view
			class="duels-hero-filter-dropdown"
			[allValuesLabel]="allValuesLabel"
			[referenceCards]="referenceCards"
			[selectedHeroes]="selectedHeroes$ | async"
			[extractor]="extractor"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(optionSelected)="onSelected($event)"
		></duels-main-filter-multiselect-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteDuelsHeroPowerFilterDropdownComponent implements AfterContentInit {
	currentFilter$: Observable<readonly string[]>;
	selectedHeroes$: Observable<readonly string[]>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.hero-power.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.heroPowers);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => conf.heroPowers;

	constructor(private readonly i18n: ILocalizationService, private readonly store: Store<WebsiteDuelsState>) {}

	ngAfterContentInit(): void {
		this.currentFilter$ = this.store.select(getCurrentHeroPowerFilter);
		this.selectedHeroes$ = this.store.select(getCurrentHeroFilter);
	}

	onSelected(option: readonly string[]) {
		this.store.dispatch(
			changeHeroPowerFilter({
				currentHeroPowerSelection: option,
			}),
		);
	}
}
