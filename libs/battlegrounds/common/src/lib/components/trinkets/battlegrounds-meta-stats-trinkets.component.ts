import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsMetaTrinketStatTierItem, buildTrinketStats } from '@firestone/battlegrounds/data-access';
import { BgsTrinketActiveTabType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { BattlegroundsTrinketsService } from '../../services/bgs-trinkets.service';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-trinkets',
	styleUrls: [`./battlegrounds-meta-stats-trinkets.component.scss`],
	template: `
		<battlegrounds-meta-stats-trinkets-view
			[stats]="trinketStats$ | async"
			[lastUpdate]="lastUpdate$ | async"
			[trinketType]="trinketType$ | async"
		></battlegrounds-meta-stats-trinkets-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsTrinketsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	trinketType$: Observable<BgsTrinketActiveTabType>;
	trinketStats$: Observable<readonly BgsMetaTrinketStatTierItem[]>;
	lastUpdate$: Observable<string | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly trinkets: BattlegroundsTrinketsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.trinkets);

		this.trinketType$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsTrinketsActiveTab));
		this.trinketStats$ = this.trinkets.trinketStats$$.pipe(
			this.mapData((stats) => buildTrinketStats(stats?.trinketStats ?? [], this.allCards)),
		);
		this.lastUpdate$ = this.trinkets.trinketStats$$.pipe(
			this.mapData((stats) => (stats ? '' + stats.lastUpdateDate : null)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
