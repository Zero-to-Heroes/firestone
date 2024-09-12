import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { currentBgHeroId } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'bgs-strategies',
	styleUrls: [`./bgs-strategies.component.scss`],
	template: ` <bgs-strategies-wrapper [heroId]="heroId$ | async"></bgs-strategies-wrapper> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsStrategiesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroId$: Observable<string>;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly nav: BattlegroundsNavigationService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav);

		this.heroId$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((categoryId) => currentBgHeroId(null, categoryId)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
