import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Map } from 'immutable';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsPostMatchStatsForReview } from '../../../../../models/battlegrounds/bgs-post-match-stats-for-review';
import { MinionStat } from '../../../../../models/battlegrounds/post-match/minion-stat';
import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { LocalizationFacadeService } from '../../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../../abstract-subscription.component';
import { normalizeCardId } from '../../../post-match/card-utils';

@Component({
	selector: 'bgs-last-warbands',
	styleUrls: [
		`../../../../../../css/global/components-global.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component.scss`,
	],
	template: `
		<div class="bgs-last-warbands" *ngIf="{ boards: boards$ | async } as value">
			<with-loading [isLoading]="false" [mainTitle]="null" [subtitle]="null" svgName="loading-spiral">
				<ng-container *ngIf="value.boards?.length; else emptyState">
					<div
						class="title"
						[owTranslate]="'app.battlegrounds.personal-stats.hero-details.last-warbands.title'"
						[translateParams]="{ value: value.boards?.length }"
					></div>
					<div class="boards" scrollable>
						<div class="board-container" *ngFor="let board of value.boards">
							<div class="meta-info">
								<div class="finish-position">{{ board.title }}</div>
								<div class="date">{{ board.date }}</div>
								<div
									class="damage dealt"
									[helpTooltip]="
										'app.battlegrounds.personal-stats.hero-details.last-warbands.damage-dealt-tooltip'
											| owTranslate
									"
								>
									<div class="damage-icon">
										<svg class="svg-icon-fill">
											<use xlink:href="assets/svg/sprite.svg#sword" />
										</svg>
									</div>
									<div
										class="label"
										[owTranslate]="
											'app.battlegrounds.personal-stats.hero-details.last-warbands.damage-dealt'
										"
									></div>
								</div>
								<div
									class="damage received"
									[helpTooltip]="
										'app.battlegrounds.personal-stats.hero-details.last-warbands.damage-taken-tooltip'
											| owTranslate
									"
								>
									<div class="damage-icon">
										<svg class="svg-icon-fill">
											<use xlink:href="assets/svg/sprite.svg#sword" />
										</svg>
									</div>
									<div
										class="label"
										[owTranslate]="
											'app.battlegrounds.personal-stats.hero-details.last-warbands.damage-taken'
										"
									></div>
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
						[subtitle]="
							'app.battlegrounds.personal-stats.hero-details.last-warbands.empty-state-message'
								| owTranslate
						"
					></battlegrounds-empty-state>
				</ng-template>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLastWarbandsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	boards$: Observable<readonly KnownBoard[]>;

	loading = true;
	visible = false;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.boards$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(([main, nav]) => main.battlegrounds.lastHeroPostMatchStats),
		).pipe(
			filter(([gameStats, [postMatch]]) => !!postMatch && !!gameStats),
			this.mapData(([gameStats, [postMatch]]) =>
				postMatch
					.filter((postMatch) => !!postMatch?.stats?.boardHistory?.length)
					.slice(0, 15)
					.map((stat) => this.buildLastKnownBoard(stat, gameStats))
					.filter((board) => board)
					.slice(0, 5),
			),
		);
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
				? this.i18n.translateString(
						'app.battlegrounds.personal-stats.hero-details.last-warbands.finished-position',
						{ value: this.getFinishPlace(parseInt(review.additionalResult)) },
				  )
				: this.i18n.translateString('app.battlegrounds.personal-stats.hero-details.last-warbands.last-board');
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
			date: review
				? this.formatDate(review.creationTimestamp)
				: this.i18n.translateString('app.battlegrounds.personal-stats.hero-details.last-warbands.long-ago'),
		} as KnownBoard;
		return result;
	}

	private formatDate(creationTimestamp: number): string {
		return new Date(creationTimestamp).toLocaleString(this.i18n.formatCurrentLocale(), {
			month: 'long',
			day: 'numeric',
		});
	}

	private getFinishPlace(finalPlace: number): string {
		switch (finalPlace) {
			case 1:
			case 2:
			case 3:
			case 4:
				return this.i18n.translateString(
					`app.battlegrounds.personal-stats.hero-details.last-warbands.place-${finalPlace}`,
				);
			default:
				return this.i18n.translateString(
					`app.battlegrounds.personal-stats.hero-details.last-warbands.place-default`,
					{ value: finalPlace },
				);
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
