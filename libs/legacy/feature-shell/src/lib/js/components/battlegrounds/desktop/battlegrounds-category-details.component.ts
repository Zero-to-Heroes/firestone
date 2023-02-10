import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-category-details',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category-details.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-category-details"
			scrollable
			*ngIf="selectedCategoryId$ | async as selectedCategoryId"
		>
			<battlegrounds-desktop-overview *ngIf="selectedCategoryId === 'bgs-category-overview'" role="region">
			</battlegrounds-desktop-overview>
			<battlegrounds-meta-stats-heroes *ngIf="selectedCategoryId === 'bgs-category-meta-heroes'" role="region">
			</battlegrounds-meta-stats-heroes>
			<!-- <battlegrounds-personal-stats-heroes
				*ngIf="selectedCategoryId === 'bgs-category-personal-heroes'"
				role="region"
			>
			</battlegrounds-personal-stats-heroes> -->
			<!-- <battlegrounds-personal-stats-quests
				*ngIf="selectedCategoryId === 'bgs-category-personal-quests'"
				role="region"
			>
			</battlegrounds-personal-stats-quests> -->
			<battlegrounds-personal-stats-rating *ngIf="selectedCategoryId === 'bgs-category-personal-rating'">
			</battlegrounds-personal-stats-rating>
			<battlegrounds-personal-stats-stats *ngIf="selectedCategoryId === 'bgs-category-personal-stats'">
			</battlegrounds-personal-stats-stats>
			<battlegrounds-perfect-games *ngIf="selectedCategoryId === 'bgs-category-perfect-games'">
			</battlegrounds-perfect-games>
			<battlegrounds-personal-stats-hero-details
				*ngIf="selectedCategoryId && selectedCategoryId.indexOf('bgs-category-personal-hero-details') !== -1"
			>
			</battlegrounds-personal-stats-hero-details>
			<battlegrounds-simulator *ngIf="selectedCategoryId === 'bgs-category-simulator'"> </battlegrounds-simulator>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	selectedCategoryId$: Observable<string>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.selectedCategoryId$ = this.store
			.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId)
			.pipe(
				filter(([selectedCategoryId]) => !!selectedCategoryId),
				this.mapData(([selectedCategoryId]) => selectedCategoryId),
			);
	}
}
