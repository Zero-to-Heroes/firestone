import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService, Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { MinionStat } from '../../../../../models/battlegrounds/post-match/minion-stat';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../../services/overwolf.service';
import { normalizeCardId } from '../../../post-match/card-utils';

@Component({
	selector: 'bgs-last-warbands',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/hero-details/bgs-last-warbands.component.scss`,
		`../../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="bgs-last-warbands">
			<div class="boards" *ngIf="lastKnownBoards" scrollable>
				<bgs-board
					*ngFor="let board of lastKnownBoards"
					[entities]="board.entities"
					[customTitle]="board.title"
					[minionStats]="board.minionStats"
					[finalBoard]="true"
					[useFullWidth]="true"
					[debug]="false"
				></bgs-board>
			</div>
			<div class="empty-state" *ngIf="!lastKnownBoards">
				Loading last known boards
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLastWarbandsComponent implements AfterViewInit {
	_state: MainWindowState;

	lastKnownBoards: readonly KnownBoard[];

	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state) {
			return;
		}
		this.lastKnownBoards = this._state.battlegrounds.lastHeroPostMatchStats
			? this._state.battlegrounds.lastHeroPostMatchStats
					.filter(postMatch => postMatch?.stats?.boardHistory && postMatch?.stats?.boardHistory.length > 0)
					.map(postMatch => {
						const bgsBoard = postMatch?.stats?.boardHistory[postMatch?.stats?.boardHistory.length - 1];
						const boardEntities = bgsBoard.board.map(boardEntity =>
							boardEntity instanceof Entity || boardEntity.tags instanceof Map
								? Entity.create(new Entity(), boardEntity as EntityDefinition)
								: Entity.fromJS((boardEntity as unknown) as EntityAsJS),
						) as readonly Entity[];

						const review = this._state.stats.gameStats.stats.find(
							matchStat => matchStat.reviewId === postMatch.reviewId,
						);

						const title =
							review && review.additionalResult
								? `You finished ${this.getFinishPlace(parseInt(review.additionalResult))}`
								: `Last board`;

						const normalizedIds = [
							...new Set(boardEntities.map(entity => normalizeCardId(entity.cardID, this.allCards))),
						];
						const minionStats = normalizedIds.map(
							cardId =>
								({
									cardId: cardId,
									damageDealt: this.extractDamage(cardId, postMatch?.stats.totalMinionsDamageDealt),
									damageTaken: this.extractDamage(cardId, postMatch?.stats.totalMinionsDamageTaken),
								} as MinionStat),
						);
						return {
							entities: boardEntities,
							title: title,
							minionStats: minionStats,
						} as KnownBoard;
					})
			: null;
		console.log('last known boards', this.lastKnownBoards, this._state);
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
			.filter(cardId => normalizeCardId(cardId, this.allCards) === normalizedCardId)
			.map(cardId => totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
	}
}

interface KnownBoard {
	readonly entities: readonly Entity[];
	readonly title: string;
	readonly minionStats: readonly MinionStat[];
}
