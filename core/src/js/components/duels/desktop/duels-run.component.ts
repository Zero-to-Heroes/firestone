import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsRun } from '../../../models/duels/duels-run';
import { RunStep } from '../../../models/duels/run-step';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { DuelsViewPersonalDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-personal-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-run',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/duels/desktop/duels-run.component.scss`],
	template: `
		<div class="duels-run">
			<div class="mode-color-code {{ gameMode }}"></div>

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
						[cardTooltip]="playerCardId"
						*ngIf="playerClassImage"
					/>
					<!-- <div class="separator" *ngIf="heroPowerImage">-</div> -->
					<img
						class="hero-power"
						[src]="heroPowerImage"
						[cardTooltip]="heroPowerCardId"
						*ngIf="heroPowerImage"
					/>
					<!-- <div class="separator" *ngIf="signatureTreasureImage">-</div> -->
					<img
						class="signature-treasure"
						[src]="signatureTreasureImage"
						[cardTooltip]="signatureTreasureCardId"
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
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">
					<div class="text">View deck</div>
					<div class="icon" inlineSVG="assets/svg/view_deck.svg"></div>
				</div>
				<div class="group show-more" [ngClass]="{ 'expanded': isExpanded }" (click)="toggleShowMore()">
					<div class="text">{{ isExpanded ? 'Minimize View' : 'View Run' }}</div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="isExpanded">
			<ul class="details">
				<li *ngFor="let step of steps">
					<replay-info [replay]="step" [displayCoin]="false" [displayLoot]="displayLoot"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunComponent implements AfterViewInit {
	@Output() runExpanded: EventEmitter<DuelsRun> = new EventEmitter<DuelsRun>();
	@Output() runCollapsed: EventEmitter<DuelsRun> = new EventEmitter<DuelsRun>();

	@Input() set run(value: DuelsRun) {
		this._run = value;

		this.deckstring = value.initialDeckList;
		this.gameMode = value.type;
		this.gameModeImage =
			value.type === 'duels'
				? 'assets/images/deck/ranks/casual_duels.png'
				: 'assets/images/deck/ranks/heroic_duels.png';
		this.gameModeTooltip = value.type === 'duels' ? 'Duels' : 'Heroic Duels';
		this.wins = value.wins;
		this.losses = value.losses;
		this.rating = value.ratingAtStart;
		this.deltaRating =
			value.ratingAtEnd && !isNaN(value.ratingAtEnd) ? value.ratingAtEnd - value.ratingAtStart : null;
		this.steps = this.buildSteps(value.steps);
		this.rewards = value.rewards;

		this.playerClassImage = value.heroCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroCardId}.jpg`
			: null;
		this.playerCardId = value.heroCardId;
		const heroCard = value.heroCardId ? this.allCards.getCard(value.heroCardId) : null;
		this.playerClassTooltip = heroCard ? `${heroCard.name} (${heroCard.playerClass})` : null;

		this.heroPowerCardId = value.heroPowerCardId;
		this.heroPowerImage = value.heroPowerCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroPowerCardId}.jpg`
			: null;
		const heroPowerCard = value.heroPowerCardId ? this.allCards.getCard(value.heroPowerCardId) : null;
		this.heroPowerTooltip = heroPowerCard ? heroPowerCard.name : null;

		this.signatureTreasureCardId = value.signatureTreasureCardId;
		this.signatureTreasureImage = value.signatureTreasureCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.signatureTreasureCardId}.jpg`
			: null;
		const signatureTreasureCard = value.signatureTreasureCardId
			? this.allCards.getCard(value.signatureTreasureCardId)
			: null;
		this.signatureTreasureTooltip = signatureTreasureCard ? signatureTreasureCard.name : null;
		// console.log('setting value', value);
	}

	@Input() displayLoot = true;

	gameMode: 'duels' | 'paid-duels';
	deckstring: string;
	gameModeImage: string;
	gameModeTooltip: string;
	rating: number;
	playerCardId: string;
	playerClassImage: string;
	playerClassTooltip: string;
	heroPowerCardId: string;
	heroPowerImage: string;
	heroPowerTooltip: string;
	signatureTreasureCardId: string;
	signatureTreasureImage: string;
	signatureTreasureTooltip: string;
	wins: number;
	losses: number;
	deltaRating: number;
	steps: readonly RunStep[];
	rewards: readonly DuelsRewardsInfo[];

	isExpanded: boolean;

	private _run: DuelsRun;
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
		if (this.isExpanded) {
			this.runExpanded.next(this._run);
		} else {
			this.runCollapsed.next(this._run);
		}
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

	buildSteps(steps: readonly (GameStat | DuelsRunInfo)[]): readonly RunStep[] {
		const result: RunStep[] = [];
		for (let i = 0; i < steps.length; i++) {
			if ((steps[i] as GameStat).opponentCardId) {
				result.push(
					GameStat.create({
						...steps[i],
					} as RunStep) as RunStep,
				);
			} else if ((steps[i] as DuelsRunInfo).chosenOptionIndex && result.length > 0) {
				const lastGameIndex = result.length - 1;
				const info: DuelsRunInfo = steps[i] as DuelsRunInfo;
				result[lastGameIndex] = GameStat.create({
					...result[lastGameIndex],
					treasureCardId:
						info.bundleType === 'treasure'
							? info[`option${info.chosenOptionIndex}`]
							: result[lastGameIndex].treasureCardId,
					lootCardIds:
						info.bundleType === 'loot' ? this.extractLoot(info) : result[lastGameIndex].lootCardIds,
				} as RunStep) as RunStep;
			}
		}
		// console.debug('built steps', result, steps);
		return result;
	}

	private extractLoot(info: DuelsRunInfo): readonly string[] {
		if (info.chosenOptionIndex <= 0) {
			return null;
		}
		return info[`option${info.chosenOptionIndex}Contents`];
	}
}
