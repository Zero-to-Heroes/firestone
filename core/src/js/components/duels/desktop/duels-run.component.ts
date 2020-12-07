import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsRun } from '../../../models/duels/duels-run';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { DuelsViewPersonalDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-personal-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-run',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/duels/desktop/duels-run.component.scss`],
	template: `
		<div class="duels-run">
			<div class="left-info">
				<div class="group mode">
					<img class="game-mode" [src]="gameModeImage" [helpTooltip]="gameModeTooltip" />
					<div class="rating" *ngIf="rating">{{ rating }}</div>
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
						[helpTooltip]="playerClassTooltip"
						*ngIf="playerClassImage"
					/>
					<div class="separator" *ngIf="heroPowerImage">-</div>
					<img
						class="hero-power"
						[src]="heroPowerImage"
						[helpTooltip]="heroPowerTooltip"
						*ngIf="heroPowerImage"
					/>
					<div class="separator" *ngIf="signatureTreasureImage">-</div>
					<img
						class="signature-treasure"
						[src]="signatureTreasureImage"
						[helpTooltip]="signatureTreasureTooltip"
						*ngIf="signatureTreasureImage"
					/>
				</div>

				<div class="group rewards">
					<duels-reward *ngFor="let reward of rewards" [reward]="reward"></duels-reward>
				</div>

				<div
					class="group delta-rating"
					[ngClass]="{ 'positive': deltaRating > 0, 'negative': deltaRating < 0 }"
					*ngIf="deltaRating != null"
				>
					<div class="value">{{ deltaRating }}</div>
					<div class="text">Rating</div>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">View deck</div>
				<div class="group show-more" (click)="toggleShowMore()">
					{{ isExpanded ? 'Hide details' : 'Show details' }}
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="isExpanded">
			<ul class="details">
				<li *ngFor="let step of steps">
					<loot-info [loot]="step" *ngIf="isLootInfo(step)"></loot-info>
					<replay-info [replay]="step" *ngIf="isReplayInfo(step)"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunComponent implements AfterViewInit {
	@Input() set run(value: DuelsRun) {
		console.log('showing run', value);
		this.deckstring = value.initialDeckList;
		this.gameModeImage = 'assets/images/deck/ranks/duels.png';
		this.gameModeTooltip = value.type === 'duels' ? 'Duels' : 'Heroic Duels';
		this.wins = value.wins;
		this.losses = value.losses;
		this.rating = value.ratingAtStart;
		this.deltaRating =
			value.ratingAtEnd && !isNaN(value.ratingAtEnd) ? value.ratingAtEnd - value.ratingAtStart : null;
		this.steps = value.steps;
		this.rewards = value.rewards;

		this.playerClassImage = value.heroCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroCardId}.jpg`
			: null;
		const heroCard = value.heroCardId ? this.allCards.getCard(value.heroCardId) : null;
		this.playerClassTooltip = heroCard ? `${heroCard.name} (${heroCard.playerClass})` : null;

		this.heroPowerImage = value.heroPowerCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroPowerCardId}.jpg`
			: null;
		const heroPowerCard = value.heroPowerCardId ? this.allCards.getCard(value.heroPowerCardId) : null;
		this.heroPowerTooltip = heroPowerCard ? heroPowerCard.name : null;

		this.signatureTreasureImage = value.signatureTreasureCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.signatureTreasureCardId}.jpg`
			: null;
		const signatureTreasureCard = value.signatureTreasureCardId
			? this.allCards.getCard(value.signatureTreasureCardId)
			: null;
		this.signatureTreasureTooltip = signatureTreasureCard ? signatureTreasureCard.name : null;
		// console.log('setting value', value);
	}

	deckstring: string;
	gameModeImage: string;
	gameModeTooltip: string;
	rating: number;
	playerClassImage: string;
	playerClassTooltip: string;
	heroPowerImage: string;
	heroPowerTooltip: string;
	signatureTreasureImage: string;
	signatureTreasureTooltip: string;
	wins: number;
	losses: number;
	deltaRating: number;
	steps: readonly (GameStat | DuelsRunInfo)[];
	rewards: readonly DuelsRewardsInfo[];

	isExpanded: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowMore() {
		this.isExpanded = !this.isExpanded;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	showDeck() {
		this.stateUpdater.next(new DuelsViewPersonalDeckDetailsEvent(this.deckstring));
	}

	isReplayInfo(value: GameStat | DuelsRunInfo): boolean {
		return (value as GameStat).buildNumber != null;
	}

	isLootInfo(value: GameStat | DuelsRunInfo): boolean {
		return (value as DuelsRunInfo).bundleType === 'treasure';
	}
}
