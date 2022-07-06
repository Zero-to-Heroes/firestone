import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { CardsFacadeService } from '@services/cards-facade.service';
import { ArenaRun } from '../../../models/arena/arena-run';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'arena-run',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/arena/desktop/arena-run.component.scss`],
	template: `
		<div class="arena-run">
			<div class="left-info">
				<div class="group mode">
					<img class="game-mode" [src]="gameModeImage" [helpTooltip]="gameModeTooltip" />
				</div>

				<div class="group result" *ngIf="wins != null">
					<div class="wins">{{ wins }}</div>
					<div class="separator">-</div>
					<div class="losses">{{ losses }}</div>
				</div>

				<div class="group player-images">
					<img
						class="player-class"
						[src]="playerClassImage"
						[cardTooltip]="playerCardId"
						*ngIf="playerClassImage"
					/>
				</div>

				<div class="group rewards" *ngIf="rewards?.length">
					<duels-reward
						*ngFor="let reward of rewards; trackBy: trackByRewardFn"
						[reward]="reward"
					></duels-reward>
				</div>
			</div>
			<div class="right-info">
				<div class="group show-more" [ngClass]="{ 'expanded': _isExpanded }" (click)="toggleShowMore()">
					<div class="text" *ngIf="_isExpanded" [owTranslate]="'app.arena.runs.minimize-run-button'"></div>
					<div class="text" *ngIf="!_isExpanded" [owTranslate]="'app.arena.runs.view-run-button'"></div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="_isExpanded">
			<ul class="details">
				<li *ngFor="let step of steps; trackBy: trackByStepFn">
					<replay-info
						[replay]="step"
						[displayCoin]="false"
						[displayTime]="false"
						[displayLoot]="_displayLoot"
						[displayShortLoot]="_displayShortLoot"
					></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunComponent {
	@Input() set run(value: ArenaRun) {
		this._run = value;
		this.updateValues();
	}

	deckstring: string;
	gameModeImage: string;
	gameModeTooltip: string;
	playerCardId: string;
	playerClassImage: string;
	playerClassTooltip: string;
	wins: number;
	losses: number;
	steps: readonly GameStat[];
	rewards: readonly ArenaRewardInfo[];
	_isExpanded: boolean;

	private _run: ArenaRun;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	toggleShowMore() {
		// Duels goes through a state event here, not sure why?
		this._isExpanded = !this._isExpanded;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByRewardFn(index: number, item: ArenaRewardInfo) {
		return item.reviewId + '-' + item.rewardType + '-' + item.rewardAmount + '-' + item.rewardBoosterId;
	}

	trackByStepFn(index: number, item: GameStat) {
		return item.reviewId;
	}

	private updateValues() {
		if (!this._run) {
			return;
		}

		this.deckstring = this._run.initialDeckList;
		this.steps = this._run.steps;

		this.wins = this._run.wins;
		this.losses = this._run.losses;
		this.gameModeTooltip = this.i18n.translateString('app.arena.runs.run-name', { value: this.wins });
		this.gameModeImage = `assets/images/deck/ranks/arena/arena${this.wins}wins.png`;
		this.rewards = this._run.rewards;

		this.playerClassImage = this._run.heroCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._run.heroCardId}.jpg`
			: null;
		this.playerCardId = this._run.heroCardId;
		const heroCard = this._run.heroCardId ? this.allCards.getCard(this._run.heroCardId) : null;
		this.playerClassTooltip = heroCard ? `${heroCard.name} (${heroCard.playerClass})` : null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
