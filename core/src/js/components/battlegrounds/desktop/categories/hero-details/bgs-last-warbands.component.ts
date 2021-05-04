import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService, Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { MinionStat } from '../../../../../models/battlegrounds/post-match/minion-stat';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../../services/overwolf.service';
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
			<with-loading [isLoading]="loading" [mainTitle]="null" [subtitle]="null" svgName="loading-spiral">
				<div class="title" *ngIf="lastKnownBoards && lastKnownBoards.length > 0">
					Last {{ lastKnownBoards.length }} matches
				</div>
				<div class="boards" scrollable *ngIf="lastKnownBoards && lastKnownBoards.length > 0">
					<div class="board-container" *ngFor="let board of lastKnownBoards">
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
					</div>
				</div>
				<battlegrounds-empty-state
					*ngIf="!lastKnownBoards || lastKnownBoards.length === 0"
					subtitle="Start playing Battlegrounds with this hero to collect some information"
				></battlegrounds-empty-state>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLastWarbandsComponent implements AfterViewInit {
	_state: MainWindowState;
	_category: BattlegroundsPersonalStatsHeroDetailsCategory;

	lastKnownBoards: readonly KnownBoard[];
	loading = true;
	visible = false;

	private lastReviews: readonly string[];

	@Input() set state(value: MainWindowState) {
		//console.log('setting stats', value, this._state);
		// if (value === this._state) {
		// 	return;
		// }
		this._state = value;
		this.updateValues();
	}

	@Input() set category(value: BattlegroundsPersonalStatsHeroDetailsCategory) {
		//console.log('setting category', value, this._category);
		if (value?.heroId === this._category?.heroId) {
			return;
		}
		if (value) {
			this.loading = true;
		}
		this._category = value;
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state) {
			return;
		}
		const lastStats = this._state.battlegrounds.lastHeroPostMatchStats
			? this._state.battlegrounds.lastHeroPostMatchStats
					.filter((postMatch) => postMatch?.stats?.boardHistory && postMatch?.stats?.boardHistory.length > 0)
					.slice(0, 5)
			: [];
		const lastReviews: readonly string[] = lastStats.map((stat) => stat.reviewId);
		if (arraysEqual(lastReviews, this.lastReviews)) {
			//console.log('showing the same data, not recomputing it', lastReviews, this.lastReviews);
			this.loading = false;
			return;
		}
		this.loading = true;
		//console.log('last known boards', this.lastKnownBoards, this.lastReviews);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		//console.log('showing different data, recomputing it', lastReviews, this.lastReviews);
		this.lastKnownBoards = lastStats.map((postMatch) => {
			const bgsBoard = postMatch?.stats?.boardHistory[postMatch?.stats?.boardHistory.length - 1];
			const boardEntities = bgsBoard.board.map((boardEntity) =>
				boardEntity instanceof Entity || boardEntity.tags instanceof Map
					? Entity.create(new Entity(), boardEntity as EntityDefinition)
					: Entity.fromJS((boardEntity as unknown) as EntityAsJS),
			) as readonly Entity[];

			const review = this._state.stats.gameStats.stats.find(
				(matchStat) => matchStat.reviewId === postMatch.reviewId,
			);

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
			return {
				entities: boardEntities,
				title: title,
				minionStats: minionStats,
				date: this.formatDate(review.creationTimestamp),
			} as KnownBoard;
		});
		this.lastReviews = lastReviews;
		//console.log('last known boards', this.lastKnownBoards, this.lastReviews);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.loading = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
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
