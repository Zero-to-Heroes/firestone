import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { DuelsHeroFilterType } from '@firestone/duels/data-access';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeHeroFilter } from '../+state/website/duels.actions';
import { WebsiteDuelsState } from '../+state/website/duels.models';
import { getCurrentHeroFilter } from '../+state/website/duels.selectors';

@Component({
	selector: 'website-duels-hero-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-main-filter-multiselect-dropdown-view
			class="duels-hero-filter-dropdown"
			[allValuesLabel]="allValuesLabel"
			[referenceCards]="referenceCards"
			[extractor]="extractor"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(optionSelected)="onSelected($event)"
		></duels-main-filter-multiselect-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteDuelsHeroFilterDropdownComponent implements AfterContentInit {
	currentFilter$: Observable<readonly string[]>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.hero.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.hero);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => [conf.hero];

	constructor(private readonly i18n: ILocalizationService, private readonly store: Store<WebsiteDuelsState>) {}

	ngAfterContentInit(): void {
		this.currentFilter$ = this.store.select(getCurrentHeroFilter);
	}

	onSelected(option: readonly string[]) {
		this.store.dispatch(
			changeHeroFilter({
				currentHeroSelection: option as DuelsHeroFilterType,
			}),
		);
	}
}
