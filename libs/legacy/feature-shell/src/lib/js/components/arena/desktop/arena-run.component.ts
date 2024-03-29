import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { ArenaNavigationService, ArenaRun, InternalNotableCard, buildNotableCards } from '@firestone/arena/common';
import { CardsFacadeService, ILocalizationService, formatClass } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';

@Component({
	selector: 'arena-run',
	styleUrls: [`./arena-run.component.scss`],
	template: `
		<div class="arena-run">
			<div class="left-info">
				<div class="group mode">
					<img class="game-mode" [src]="gameModeImage" [helpTooltip]="gameModeTooltip" />
				</div>

				<div class="group result" *ngIf="wins !== null">
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

				<div class="group notable-cards" *ngIf="notableCards?.length">
					<img
						*ngFor="let card of notableCards"
						class="notable-card"
						[src]="card.image"
						[cardTooltip]="card.cardId"
					/>
				</div>

				<div class="group score" *ngIf="!!deckScore" [helpTooltip]="deckScoreTooltip">
					<div class="image" [inlineSVG]="'assets/svg/star.svg'"></div>
					<div class="value">{{ deckScore }}</div>
				</div>

				<div class="group rewards" *ngIf="rewards?.length">
					<duels-reward
						*ngFor="let reward of rewards; trackBy: trackByRewardFn"
						[reward]="reward"
					></duels-reward>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">
					<div class="text" [owTranslate]="'app.duels.run.view-deck-button'"></div>
					<div class="icon" inlineSVG="assets/svg/view_deck.svg"></div>
				</div>
				<div class="group show-more" [ngClass]="{ expanded: _isExpanded }" (click)="toggleShowMore()">
					<div class="text" *ngIf="_isExpanded" [owTranslate]="'app.arena.runs.minimize-run-button'"></div>
					<div class="text" *ngIf="!_isExpanded" [owTranslate]="'app.arena.runs.view-run-button'"></div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="_isExpanded">
			<ul class="details">
				<li *ngFor="let step of steps; trackBy: trackByStepFn">
					<replay-info-generic
						[replay]="step"
						[displayCoin]="false"
						[displayTime]="false"
					></replay-info-generic>
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
	gameModeTooltip: string | null;
	playerCardId: string;
	playerClassImage: string | null;
	playerClassTooltip: string | null;
	wins: number;
	losses: number;
	deckImpact: string | null;
	deckScore: string | null;
	deckScoreTooltip: string | null;
	steps: readonly GameStat[];
	rewards: readonly ArenaRewardInfo[];
	_isExpanded: boolean;
	notableCards: readonly InternalNotableCard[];

	private _run: ArenaRun;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
		private readonly nav: ArenaNavigationService,
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

	async showDeck() {
		await this.nav.isReady();

		this.nav.selectedCategoryId$$.next('arena-deck-details');
		this.nav.selectedPersonalRun$$.next(this._run);
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
		this.playerClassTooltip =
			heroCard && !!heroCard?.classes?.length
				? `${heroCard.name} (${formatClass(heroCard.classes[0], this.i18n)})`
				: null;
		this.deckScore = this._run.draftStat?.deckScore != null ? this._run.draftStat.deckScore.toFixed(1) : null;
		this.deckImpact = this._run.draftStat?.deckImpact != null ? this._run.draftStat.deckImpact.toFixed(2) : null;
		this.deckScoreTooltip = this.i18n.translateString('app.arena.runs.deck-score-tooltip');
		this.notableCards = buildNotableCards(this._run.initialDeckList, this.allCards);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
