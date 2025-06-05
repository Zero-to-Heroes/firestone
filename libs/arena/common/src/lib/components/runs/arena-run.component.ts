/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, formatClass, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { extractTime, extractTimeWithHours } from '@firestone/stats/common';
import { buildNewFormatGameModeImage, GameStat } from '@firestone/stats/data-access';
import { Subscription } from 'rxjs';
import { InternalNotableCard } from '../../models/arena-high-wins-runs';
import { ArenaRun } from '../../models/arena-run';
import { buildNotableCards } from '../../services/arena-high-wins-runs.service';
import { ArenaNavigationService } from '../../services/arena-navigation.service';

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
						[helpTooltip]="playerClassTooltip"
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

				<div class="group time" *ngIf="totalRunTime" [ngClass]="{ empty: totalRunTime === '-' }">
					<div class="value" [helpTooltip]="averageMatchTimeTooltip">{{ totalRunTime }}</div>
				</div>

				<div class="group score" *ngIf="!!deckScore" [helpTooltip]="deckScoreTooltip">
					<div class="image" [inlineSVG]="'assets/svg/star.svg'"></div>
					<div class="value">{{ deckScore }}</div>
				</div>

				<div class="group current-draft" *ngIf="cardsInDeck !== null">
					<div class="value">{{ cardsInDeck }}</div>
				</div>

				<div class="group rewards" *ngIf="rewards?.length">
					<arena-reward
						*ngFor="let reward of rewards; trackBy: trackByRewardFn"
						[reward]="reward"
					></arena-reward>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">
					<div class="text" [fsTranslate]="'app.duels.run.view-deck-button'"></div>
					<div class="icon" inlineSVG="assets/svg/view_deck.svg"></div>
				</div>
				<div class="group show-more" [ngClass]="{ expanded: _isExpanded }" (click)="toggleShowMore()">
					<div class="text" *ngIf="_isExpanded" [fsTranslate]="'app.arena.runs.minimize-run-button'"></div>
					<div class="text" *ngIf="!_isExpanded" [fsTranslate]="'app.arena.runs.view-run-button'"></div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="_isExpanded">
			<ul class="details">
				<li class="step" *ngFor="let step of steps; trackBy: trackByStepFn">
					<replay-info-generic-2 [replay]="step"></replay-info-generic-2>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
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
	cardsInDeck: string | null;
	totalRunTime: string | null;
	averageMatchTimeTooltip: string | null;

	private _run: ArenaRun;
	private replaysShowClassIcon: boolean;
	private sub$$: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly nav: ArenaNavigationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.sub$$ = this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.replaysShowClassIcon))
			.subscribe((replaysShowClassIcon) => {
				this.replaysShowClassIcon = replaysShowClassIcon;
				this.updateValues();
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$.unsubscribe();
	}

	toggleShowMore() {
		this._isExpanded = !this._isExpanded;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByRewardFn(index: number, item: ArenaRewardInfo) {
		return item.runId + '-' + item.rewardType + '-' + item.rewardAmount + '-' + item.rewardBoosterId;
	}

	trackByStepFn(index: number, item: GameStat) {
		return item.reviewId;
	}

	async showDeck() {
		await this.nav.isReady();

		this.nav.selectedCategoryId$$.next('arena-deck-details');
		this.nav.setPersonalRunId(this._run?.id);
	}

	private updateValues() {
		if (!this._run) {
			return;
		}

		this.deckstring = this._run.initialDeckList;
		this.steps = this._run.steps;

		this.wins = this._run.wins;
		this.losses = this._run.losses;
		const isNewFormat =
			this._run.creationTimestamp && new Date(this._run.creationTimestamp) > new Date('2025-06-02T18:00:00Z');
		this.gameModeTooltip = isNewFormat
			? this.buildNewFormatGameModeTooltip()
			: this.i18n.translateString('app.arena.runs.run-name', { value: this.wins ?? 0 });
		this.gameModeImage = isNewFormat
			? buildNewFormatGameModeImage(this._run.gameMode)
			: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/arena/arena${
					this.wins ?? 0
			  }wins.png`;
		this.rewards = this._run.rewards;

		const heroCard = this._run.heroCardId ? this.allCards.getCard(this._run.heroCardId) : null;
		if (this.replaysShowClassIcon && heroCard) {
			const image = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
			this.playerClassImage = image;
		} else {
			this.playerClassImage = this._run.heroCardId
				? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._run.heroCardId}.jpg`
				: null;
		}
		this.playerCardId = this._run.heroCardId;
		this.playerClassTooltip =
			heroCard && !!heroCard?.classes?.length
				? `${heroCard.name} (${formatClass(heroCard.classes[0], this.i18n)})`
				: null;

		this.deckScore = this._run.draftStat?.deckScore != null ? this._run.draftStat.deckScore.toFixed(1) : null;
		this.deckImpact = this._run.draftStat?.deckImpact != null ? this._run.draftStat.deckImpact.toFixed(2) : null;
		this.deckScoreTooltip = this.i18n.translateString('app.arena.runs.deck-score-tooltip');
		this.notableCards = buildNotableCards(this._run.initialDeckList, this.allCards);

		const totalRunTime = this._run.steps.map((step) => step.gameDurationSeconds).reduce((a, b) => a + b, 0);
		this.totalRunTime = !totalRunTime
			? '-'
			: totalRunTime > 3600
			? this.i18n.translateString('global.duration.hrs-min-short', {
					...extractTimeWithHours(totalRunTime),
			  })
			: this.i18n.translateString('global.duration.min-sec', {
					...extractTime(totalRunTime),
			  });
		const averageMatchTime = Math.round(totalRunTime / this._run.steps.length);
		this.averageMatchTimeTooltip = this.i18n.translateString('app.arena.runs.average-match-time', {
			value: this.i18n.translateString('global.duration.min-sec', {
				...extractTime(averageMatchTime),
			}),
		});

		if (this._run.totalCardsInDeck != 30) {
			this.cardsInDeck = `Drafted ${this._run.totalCardsInDeck} / 30 cards`;
		} else {
			this.cardsInDeck = null;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildNewFormatGameModeTooltip() {
		if (this._run.gameMode === 'arena') {
			return this.i18n.translateString('app.arena.runs.run-name', { value: this._run.wins });
		} else if (this._run.gameMode === 'arena-underground') {
			const wins = this._run.wins;
			const losses = wins === 0 ? '-' + this._run.losses : '';
			const winLoss = `${wins}${losses}`;
			return this.i18n.translateString('app.arena.runs.underground-run-name', { value: winLoss });
		}
		return null;
	}
}
