import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Map } from 'immutable';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsPostMatchStatsForReview } from '../../../../../models/battlegrounds/bgs-post-match-stats-for-review';
import { MinionStat } from '../../../../../models/battlegrounds/post-match/minion-stat';
import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../../services/utils';
import { normalizeCardId } from '../../../post-match/card-utils';

@Component({
	selector: 'bgs-last-warbands',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component.scss`,
	],
	template: `
		<div class="bgs-last-warbands">
			<with-loading [isLoading]="false" [mainTitle]="null" [subtitle]="null" svgName="loading-spiral">
				<ng-container *ngIf="boards$ | async as boards; else emptyState">
					<div class="title">Last {{ boards?.length }} matches</div>
					<div class="boards" scrollable>
						<div class="board-container" *ngFor="let board of boards">
							<div class="meta-info">
								<div class="finish-position">{{ board.title }}</div>
								<div class="date">{{ board.date }}</div>
								<div
									class="damage dealt"
									helpTooltip="Total damage dealt by each unit. The damage for units with the same name is aggregated, and not split per unit"
								>
									<div class="damage-icon">
										<svg class="svg-icon-fill">
											<use xlink:href="assets/svg/sprite.svg#sword" />
										</svg>
									</div>
									<div class="label">Dmg. dealt</div>
								</div>
								<div
									class="damage received"
									helpTooltip="Total damage received by each unit. The damage for units with the same name is aggregated, and not split per unit"
								>
									<div class="damage-icon">
										<svg class="svg-icon-fill">
											<use xlink:href="assets/svg/sprite.svg#sword" />
										</svg>
									</div>
									<div class="label">Dmg. taken</div>
								</div>
							</div>
							<bgs-board
								[entities]="board.entities"
								[customTitle]="null"
								[minionStats]="board.minionStats"
								[finalBoard]="true"
								[useFullWidth]="true"
								[hideDamageHeader]="true"
								[debug]="false"
							></bgs-board>
						</div></div
				></ng-container>
				<ng-template #emptyState>
					<battlegrounds-empty-state
						subtitle="Start playing Battlegrounds with this hero to collect some information"
					></battlegrounds-empty-state>
				</ng-template>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLastWarbandsComponent {
	boards$: Observable<readonly KnownBoard[]>;
	loading = true;
	visible = false;

	constructor(private readonly allCards: CardsFacadeService, private readonly store: AppUiStoreFacadeService) {
		this.boards$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.lastHeroPostMatchStats,
				([main, nav]) => main.stats.gameStats,
			)
			.pipe(
				filter(([postMatch, gameStats]) => !!postMatch && !!gameStats),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(
					([postMatch, gameStats]) =>
						[
							postMatch.filter((postMatch) => !!postMatch?.stats?.boardHistory?.length).slice(0, 5),
							gameStats.stats,
						] as [readonly BgsPostMatchStatsForReview[], readonly GameStat[]],
				),
				distinctUntilChanged((a, b) => this.compareValues(a, b)),
				map(([stats, gameStats]) =>
					stats.map((stat) => this.buildLastKnownBoard(stat, gameStats)).filter((board) => board),
				),
				tap((boards) => console.debug('[cd] emitting boards in ', this.constructor.name, boards)),
			);
	}

	private compareValues(
		a: [readonly BgsPostMatchStatsForReview[], readonly GameStat[]],
		b: [readonly BgsPostMatchStatsForReview[], readonly GameStat[]],
	): boolean {
		if (!arraysEqual(a[1], b[1])) {
			return false;
		}
		return JSON.stringify(a[0]) === JSON.stringify(b[0]);
	}

	private buildLastKnownBoard(postMatch: BgsPostMatchStatsForReview, gameStats: readonly GameStat[]): KnownBoard {
		const bgsBoard = postMatch?.stats?.boardHistory[postMatch?.stats?.boardHistory.length - 1];
		const boardEntities = bgsBoard.board.map((boardEntity) =>
			boardEntity instanceof Entity || boardEntity.tags instanceof Map
				? Entity.create(new Entity(), boardEntity as EntityDefinition)
				: Entity.fromJS((boardEntity as unknown) as EntityAsJS),
		) as readonly Entity[];
		const review = gameStats.find((matchStat) => matchStat.reviewId === postMatch.reviewId);
		const title =
			review && review.additionalResult
				? `Finished ${this.getFinishPlace(parseInt(review.additionalResult))}`
				: `Last board`;
		const normalizedIds = [
			...new Set(boardEntities.map((entity) => normalizeCardId(entity.cardID, this.allCards))),
		];
		const minionStats = normalizedIds.map(
			(cardId) =>
				({
					cardId: cardId,
					damageDealt: this.extractDamage(cardId, postMatch?.stats?.totalMinionsDamageDealt),
					damageTaken: this.extractDamage(cardId, postMatch?.stats?.totalMinionsDamageTaken),
				} as MinionStat),
		);
		const result = {
			entities: boardEntities,
			title: title,
			minionStats: minionStats,
			date: review ? this.formatDate(review.creationTimestamp) : 'Long ago',
		} as KnownBoard;
		return result;
	}

	private formatDate(creationTimestamp: number): string {
		return new Date(creationTimestamp).toLocaleString('en-us', {
			month: 'long',
			day: 'numeric',
		});
	}

	private getFinishPlace(finalPlace: number): string {
		switch (finalPlace) {
			case 1:
				return '1st!!!!';
			case 2:
				return '2nd!!!';
			case 3:
				return '3rd!!';
			case 4:
				return '4th!';
			default:
				return finalPlace + 'th';
		}
	}

	private extractDamage(normalizedCardId: string, totalMinionsDamageDealt: { [cardId: string]: number }): number {
		return Object.keys(totalMinionsDamageDealt)
			.filter((cardId) => normalizeCardId(cardId, this.allCards) === normalizedCardId)
			.map((cardId) => totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
	}
}

interface KnownBoard {
	readonly entities: readonly Entity[];
	readonly title: string;
	readonly minionStats: readonly MinionStat[];
	readonly date: string;
}
