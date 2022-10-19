import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ChartDataSets } from 'chart.js';
import { Label } from 'ng2-charts';
import { combineLatest } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { isBattlegrounds } from '../../../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../../abstract-subscription.component';

@Component({
	selector: 'bgs-mmr-evolution-for-hero',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component.scss`,
	],
	template: `
		<div class="bgs-mmr-evolution-for-hero">
			<!-- See https://medium.com/@yurykatkov/how-to-avoid-multiple-async-pipes-in-angular-ff0d51a8d368 -->
			<graph-with-single-value
				*ngIf="{ value: value$ | async } as obs"
				[data]="obs.value.data"
				[labels]="obs.value.labels"
				[emptyStateMessage]="'app.battlegrounds.personal-stats.hero-details.mmr.empty-state-message'"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMmrEvolutionForHeroComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	value$: Observable<Value>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.value$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			),
		).pipe(
			this.mapData(([gameStats, [battlegrounds, selectedCategoryId]]) =>
				this.buildValue(
					gameStats.filter((stat) => isBattlegrounds(stat.gameMode)),
					currentBgHeroId(battlegrounds, selectedCategoryId),
				),
			),
		);
	}

	private buildValue(matchStats: readonly GameStat[], heroId: string) {
		const mmrDeltas = matchStats
			.filter((match) => match.playerCardId === heroId)
			.filter((match) => match.playerRank && match.newPlayerRank)
			.map((match) => parseInt(match.newPlayerRank) - parseInt(match.playerRank))
			.reverse();
		const finalResult = [0];
		for (let i = 0; i < mmrDeltas?.length; i++) {
			finalResult[i + 1] = finalResult[i] + mmrDeltas[i];
		}
		const result = {
			data: [
				{
					data: finalResult,
					lineTension: 0,
					label: this.i18n.translateString('app.battlegrounds.personal-stats.rating.axis-label'),
				},
			],
			labels: Array.from(Array(finalResult.length), (_, i) => i + 1).map((matchIndex) => '' + matchIndex),
		};
		return result;
	}
}

interface Value {
	readonly data: ChartDataSets[];
	readonly labels: Label;
}
