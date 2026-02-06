import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/services';
import { isBattlegrounds } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { GameStatsProviderService } from '@firestone/stats/services';
import { ChartData } from 'chart.js';
import { combineLatest } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { LocalizationFacadeService } from '../../../../../services/localization-facade.service';
import { currentBgHeroId } from '../../../../../services/ui-store/app-ui-store.service';

@Component({
	standalone: false,
	selector: 'bgs-mmr-evolution-for-hero',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-mmr-evolution-for-hero.component.scss`,
	],
	template: `
		<div class="bgs-mmr-evolution-for-hero">
			<!-- See https://medium.com/@yurykatkov/how-to-avoid-multiple-async-pipes-in-angular-ff0d51a8d368 -->
			<graph-with-single-value
				*ngIf="{ value: value$ | async } as obs"
				[data]="obs.value"
				[emptyStateMessage]="'app.battlegrounds.personal-stats.hero-details.mmr.empty-state-message'"
			></graph-with-single-value>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMmrEvolutionForHeroComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	value$: Observable<ChartData<'line'>>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BattlegroundsNavigationService,
		private readonly gameStats: GameStatsProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.gameStats);

		this.value$ = combineLatest([this.gameStats.gameStats$$, this.nav.selectedCategoryId$$]).pipe(
			this.mapData(([gameStats, selectedCategoryId]) =>
				this.buildValue(
					gameStats.filter((stat) => isBattlegrounds(stat.gameMode)),
					currentBgHeroId(selectedCategoryId),
				),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	private buildValue(matchStats: readonly GameStat[], heroId: string) {
		const mmrDeltas = matchStats
			.filter((match) => match.playerCardId === heroId)
			.filter((match) => match.playerRank && match.newPlayerRank && +match.newPlayerRank >= 0)
			.map((match) => parseInt(match.newPlayerRank) - parseInt(match.playerRank))
			.reverse();
		const finalResult = [0];
		for (let i = 0; i < mmrDeltas?.length; i++) {
			finalResult[i + 1] = finalResult[i] + mmrDeltas[i];
		}
		const result = {
			datasets: [
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
