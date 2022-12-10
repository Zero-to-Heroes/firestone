import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsRun } from '../../../models/duels/duels-run';
import { RunStep } from '../../../models/duels/run-step';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { DuelsToggleExpandedRunEvent } from '../../../services/mainwindow/store/events/duels/duels-toggle-expanded-run-event';
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
					<div class="rating" *ngIf="rating != null">{{ rating }}</div>
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

				<div class="group rewards" *ngIf="rewards?.length">
					<duels-reward *ngFor="let reward of rewards" [reward]="reward"></duels-reward>
				</div>

				<div
					class="group delta-rating"
					[ngClass]="{ positive: deltaRating > 0, negative: deltaRating < 0 }"
					*ngIf="deltaRating != null"
				>
					<div class="value">{{ deltaRating }}</div>
					<div class="text" [owTranslate]="'app.duels.run.rating'"></div>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">
					<div class="text" [owTranslate]="'app.duels.run.view-deck-button'"></div>
					<div class="icon" inlineSVG="assets/svg/view_deck.svg"></div>
				</div>
				<div class="group show-more" [ngClass]="{ expanded: _isExpanded }" (click)="toggleShowMore()">
					<div class="text" *ngIf="_isExpanded" [owTranslate]="'app.duels.run.minimize-run-button'"></div>
					<div class="text" *ngIf="!_isExpanded" [owTranslate]="'app.duels.run.view-run-button'"></div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
		<div class="run-details" *ngIf="_isExpanded">
			<ul class="details">
				<li *ngFor="let step of steps">
					<replay-info-duels
						[replay]="step"
						[displayCoin]="false"
						[displayTime]="false"
						[displayLoot]="displayLoot"
						[displayShortLoot]="displayShortLoot"
					></replay-info-duels>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunComponent implements AfterViewInit {
	@Input() set isExpanded(value: boolean) {
		this._isExpanded = value;
		this.updateValues();
	}

	@Input() set run(value: DuelsRun) {
		this._run = value;
		this.updateValues();
	}

	@Input() displayLoot: boolean;
	@Input() displayShortLoot: boolean;
	@Input() hideDeckLink = false;

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
	_isExpanded: boolean;

	private _run: DuelsRun;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	toggleShowMore() {
		this.stateUpdater.next(new DuelsToggleExpandedRunEvent(this._run?.id));
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
		if (!steps) {
			return [];
		}

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
		return result;
	}

	private updateValues() {
		if (!this._run) {
			return;
		}

		this.deckstring = this._run.initialDeckList;
		this.gameMode = this._run.type;
		this.gameModeImage =
			this._run.type === 'duels'
				? 'assets/images/deck/ranks/casual_duels.png'
				: 'assets/images/deck/ranks/heroic_duels.png';
		this.gameModeTooltip =
			this._run.type === 'duels'
				? this.i18n.translateString('global.game-mode.casual-duels')
				: this.i18n.translateString('global.game-mode.heroic-duels');
		this.wins = this._run.wins;
		this.losses = this._run.losses;
		this.rating = this._run.ratingAtStart;
		this.deltaRating =
			this._run.ratingAtEnd && !isNaN(this._run.ratingAtEnd) ? this._run.ratingAtEnd - this.rating : null;
		this.steps = this.buildSteps(this._run.steps);
		this.rewards = this._run.rewards;

		this.playerClassImage = this._run.heroCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._run.heroCardId}.jpg`
			: null;
		this.playerCardId = this._run.heroCardId;
		const heroCard = this._run.heroCardId ? this.allCards.getCard(this._run.heroCardId) : null;
		this.playerClassTooltip = heroCard ? `${heroCard.name} (${heroCard.playerClass})` : null;

		this.heroPowerCardId = this._run.heroPowerCardId;
		this.heroPowerImage = this._run.heroPowerCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._run.heroPowerCardId}.jpg`
			: null;
		const heroPowerCard = this._run.heroPowerCardId ? this.allCards.getCard(this._run.heroPowerCardId) : null;
		this.heroPowerTooltip = heroPowerCard ? heroPowerCard.name : null;

		this.signatureTreasureCardId = this._run.signatureTreasureCardId;
		this.signatureTreasureImage = this._run.signatureTreasureCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._run.signatureTreasureCardId}.jpg`
			: null;
		const signatureTreasureCard = this._run.signatureTreasureCardId
			? this.allCards.getCard(this._run.signatureTreasureCardId)
			: null;
		this.signatureTreasureTooltip = signatureTreasureCard ? signatureTreasureCard.name : null;

		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	private extractLoot(info: DuelsRunInfo): readonly string[] {
		if (info.chosenOptionIndex <= 0) {
			return null;
		}
		const result = info[`option${info.chosenOptionIndex}Contents`];
		if (result && result.length === 3 && result.every((item) => item === '0')) {
			return null;
		}
		return result;
	}
}
