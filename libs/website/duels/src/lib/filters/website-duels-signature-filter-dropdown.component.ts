import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CardIds, duelsHeroConfigs } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeSignatureTreasureFilter } from '../+state/website/duels.actions';
import { WebsiteDuelsState } from '../+state/website/duels.models';
import { getCurrentHeroFilter, getCurrentSignatureFilter } from '../+state/website/duels.selectors';

@Component({
	selector: 'website-duels-signature-filter-dropdown',
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
export class WebsiteDuelsSignatureFilterDropdownComponent implements AfterContentInit {
	currentFilter$: Observable<readonly string[]>;
	selectedHeroes$: Observable<readonly string[]>;

	allValuesLabel = this.i18n.translateString('app.duels.filters.signature-treasure.all') as string;
	referenceCards = duelsHeroConfigs.flatMap((conf) => conf.signatureTreasures);
	extractor: (conf: typeof duelsHeroConfigs[0]) => readonly CardIds[] = (conf) => conf.signatureTreasures;

	constructor(private readonly i18n: ILocalizationService, private readonly store: Store<WebsiteDuelsState>) {}

	ngAfterContentInit(): void {
		this.currentFilter$ = this.store.select(getCurrentSignatureFilter);
		this.selectedHeroes$ = this.store.select(getCurrentHeroFilter);
	}

	onSelected(option: readonly string[]) {
		this.store.dispatch(
			changeSignatureTreasureFilter({
				currentSignatureSelection: option,
			}),
		);
	}
}
