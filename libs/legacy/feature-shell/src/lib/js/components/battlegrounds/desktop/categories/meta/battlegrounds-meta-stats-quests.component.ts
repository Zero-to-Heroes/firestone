import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaQuestStatTierItem, buildQuestStats } from '@firestone/battlegrounds/data-access';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-meta-stats-quests',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-quests.component.scss`,
	],
	template: `
		<battlegrounds-meta-stats-quests-view [stats]="questStats$ | async"></battlegrounds-meta-stats-quests-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	questStats$: Observable<readonly BgsMetaQuestStatTierItem[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.questStats$ = combineLatest([
			this.store.bgsQuests$(),
			this.listenForBasicPref$((prefs) => prefs.bgsActiveRankFilter),
		]).pipe(this.mapData(([stats, mmrFilter]) => buildQuestStats(stats?.questStats ?? [], mmrFilter)));
	}
}
