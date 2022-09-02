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
import { Map } from 'immutable';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { GameState } from '../../../../models/decktracker/game-state';
import { TwitchBgsPlayer, TwitchBgsState } from './twitch-bgs-state';
import { TwitchPreferencesService } from './twitch-preferences.service';

@Component({
	selector: 'state-mouse-over',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/state-mouse-over.component.scss',
	],
	template: `
		<div class="state-mouse-over" [style.left.%]="horizontalOffset">
			<ul
				class="bgs-leaderboard"
				*ngIf="_bgsState && _bgsState.inGame && !_bgsState.gameEnded && bgsPlayers.length === 8"
			>
				<leaderboard-empty-card
					*ngFor="let bgsPlayer of bgsPlayers; let i = index; trackBy: trackByLeaderboard"
					[bgsPlayer]="bgsPlayer"
					[currentTurn]="currentTurn"
					[showLiveInfo]="showLiveInfo$ | async"
				>
				</leaderboard-empty-card>
				<div class="players-recap-icon" [ngClass]="{ 'inversed': magnifierIconOnTop$ | async }">
					<svg
						class="svg-icon-fill icon"
						(mouseenter)="toggleLiveInfo(true)"
						(mouseleave)="toggleLiveInfo(false)"
					>
						<use xlink:href="assets/svg/sprite.svg#search" />
					</svg>
				</div>
			</ul>
			<ul class="hero top-hero">
				<div class="weapon">
					<empty-card [cardId]="topWeaponCard" [cardTooltipPosition]="'left'"></empty-card>
				</div>
				<div class="hero-power">
					<empty-card [cardId]="topHeroPowerCard" [cardTooltipPosition]="'right'"></empty-card>
				</div>
			</ul>
			<ul class="board top-board">
				<empty-card
					*ngFor="let cardId of topBoardCards"
					[cardId]="cardId"
					[cardTooltipBgs]="isBgs"
				></empty-card>
			</ul>
			<ul class="board bottom-board">
				<empty-card
					*ngFor="let cardId of bottomBoardCards"
					[cardId]="cardId"
					[cardTooltipBgs]="isBgs"
				></empty-card>
			</ul>
			<ul class="hero bottom-hero">
				<div class="weapon">
					<empty-card
						[cardId]="bottomWeaponCard"
						[cardTooltipPosition]="'left'"
						[cardTooltipBgs]="isBgs"
					></empty-card>
				</div>
				<div class="hero-power">
					<empty-card
						[cardId]="bottomHeroPowerCard"
						[cardTooltipPosition]="'right'"
						[cardTooltipBgs]="isBgs"
					></empty-card>
				</div>
			</ul>
			<ul class="bottom-hand">
				<empty-card
					*ngFor="let cardId of bottomHandCards; let i = index"
					[transform]="handRotation(i)"
					[leftOffset]="handPositionLeft(i)"
					[topOffset]="handPositionTop(i)"
					[cardId]="cardId"
					[cardTooltipBgs]="isBgs"
					[cardTooltipPosition]="'top'"
				>
				</empty-card>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMouseOverComponent implements AfterContentInit, OnDestroy {
	showLiveInfo$: Observable<boolean>;
	magnifierIconOnTop$: Observable<boolean>;

	@Input() set overlayLeftOffset(value: number) {
		this.horizontalOffset = value ?? 0;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set bgsState(value: TwitchBgsState) {
		if (value === this._bgsState) {
			return;
		}
		this._bgsState = value;
		this.bgsPlayers = this._bgsState?.leaderboard;
		this.currentTurn = this._bgsState?.currentTurn;
		this.isBgs =
			!!this._bgsState && !!this.bgsPlayers?.length && this._bgsState?.inGame && !this._bgsState?.gameEnded;
		// console.log('isBgs', this.isBgs, this._bgsState, this.bgsPlayers);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set gameState(value: GameState) {
		if (value === this._gameState) {
			return;
		}
		this._gameState = value;
		this.topHeroPowerCard = this._gameState.opponentDeck?.heroPower?.cardId;
		this.topWeaponCard = this._gameState.opponentDeck?.weapon?.cardId;
		this.topBoardCards = this._gameState.opponentDeck?.board.map((card) => card.cardId);
		this.bottomBoardCards = this._gameState.playerDeck?.board.map((card) => card.cardId);
		this.bottomHeroPowerCard = this._gameState.playerDeck?.heroPower?.cardId;
		this.bottomWeaponCard = this._gameState.playerDeck?.weapon?.cardId;
		this.bottomHandCards = this._gameState.playerDeck?.hand.map((card) => card.cardId);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set magnifierIconOnTop(value: null | '' | 'top' | 'bottom') {
		this.magnifierIconOnTopFromStreamer.next(value);
	}

	isBgs: boolean;

	_gameState: GameState;
	_bgsState: TwitchBgsState;
	horizontalOffset = 0;

	topHeroPowerCard: string;
	topWeaponCard: string;
	topBoardCards: readonly string[];
	bottomBoardCards: readonly string[];
	bottomHeroPowerCard: string;
	bottomWeaponCard: string;
	bottomHandCards: readonly string[];
	bgsPlayers: readonly TwitchBgsPlayer[];
	currentTurn: number;

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();
	private showLiveInfo = new BehaviorSubject<boolean>(false);
	private magnifierIconOnTopFromStreamer = new BehaviorSubject<null | '' | 'top' | 'bottom'>(null);

	private destroyed$ = new Subject<void>();

	constructor(private readonly cdr: ChangeDetectorRef, private readonly prefs: TwitchPreferencesService) {}

	ngAfterContentInit(): void {
		this.showLiveInfo$ = this.showLiveInfo.asObservable().pipe(takeUntil(this.destroyed$));
		this.magnifierIconOnTop$ = combineLatest(
			this.prefs.prefs.asObservable(),
			this.magnifierIconOnTopFromStreamer.asObservable(),
		).pipe(
			map(([prefs, magnifierIconOnTopFromStreamer]) => {
				if (!magnifierIconOnTopFromStreamer) {
					return prefs.magnifierIconOnTop;
				}
				return magnifierIconOnTopFromStreamer === 'top' ? true : false;
			}),
			takeUntil(this.destroyed$),
		);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	toggleLiveInfo(value: boolean) {
		this.showLiveInfo.next(value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByLeaderboard(index: number, player: TwitchBgsPlayer) {
		return player.cardId;
	}

	handRotation(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handRotation ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handRotation.has(i)
		) {
			// console.warn('could not get handrotation', i);
			return `rotate(0deg)`;
		}
		const rotation = this.handAdjustment.get(totalCards, Adjustment.create()).handRotation.get(i, 0);
		return `rotate(${rotation}deg)`;
	}

	handPositionLeft(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).positionLeft ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).positionLeft.has(i)
		) {
			// console.warn('could not get handPositionLeft', i);
			return 0;
		}
		const handAdjustment = this.handAdjustment.get(totalCards, Adjustment.create());
		const result = handAdjustment.positionLeft.get(i, 0);
		return result;
	}

	handPositionTop(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).positionTop ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).positionTop.has(i)
		) {
			// console.warn('could not get handPositionTop', i);
			return 0;
		}
		return this.handAdjustment.get(totalCards, Adjustment.create()).positionTop.get(i, 0);
	}

	private buildHandAdjustment() {
		return Map.of(
			1, // ok
			{
				handRotation: Map.of(),
				positionLeft: Map.of(0, -8),
				positionTop: Map.of(0, 5),
			} as Adjustment,
			2, // ok
			{
				handRotation: Map.of(),
				positionLeft: Map.of(0, -61, 1, 42),
				positionTop: Map.of(0, 5, 1, 5),
			} as Adjustment,
			3, // ok
			{
				handRotation: Map.of(),
				positionLeft: Map.of(0, -104, 1, -5, 2, 90),
				positionTop: Map.of(0, 5, 1, 5, 2, 5),
			} as Adjustment,
			4, // ok
			{
				handRotation: Map.of(0, -25, 1, -9, 2, 7, 3, 23),
				positionLeft: Map.of(0, -141, 1, -52, 2, 38, 3, 129),
				positionTop: Map.of(0, 10, 1, 1, 2, 9, 3, 16),
			} as Adjustment,
			5, // ok
			{
				handRotation: Map.of(0, -23, 1, -11, 2, -2, 3, 10, 4, 22),
				positionLeft: Map.of(0, -154, 1, -86, 2, -11, 3, 65, 4, 140),
				positionTop: Map.of(0, 7, 1, -4, 2, -2, 3, 4, 4, 16),
			} as Adjustment,
			6, // ok
			{
				handRotation: Map.of(0, -25, 1, -18, 2, -4, 3, 2, 4, 14, 5, 25),
				positionLeft: Map.of(0, -160, 1, -94, 2, -39, 3, 22, 4, 81, 5, 150),
				positionTop: Map.of(0, 10, 1, 2, 2, 0, 3, 0, 4, 5, 5, 16),
			} as Adjustment,
			7, // ok
			{
				handRotation: Map.of(0, -26, 1, -20, 2, -8, 3, 0, 4, 9, 5, 17, 6, 21),
				positionLeft: Map.of(0, -166, 1, -112, 2, -60, 3, -7, 4, 44, 5, 95, 6, 152),
				positionTop: Map.of(0, 7, 1, -2, 2, -2, 3, -2, 4, -3, 5, 3, 6, 17),
			} as Adjustment,
			8, // ok
			{
				handRotation: Map.of(0, -27, 1, -20, 2, -12, 3, -4, 4, 0, 5, 11, 6, 21, 7, 26),
				positionLeft: Map.of(0, -174, 1, -126, 2, -78, 3, -35, 4, 15, 5, 59, 6, 107, 7, 152),
				positionTop: Map.of(0, 12, 1, 2, 2, 2, 3, -2, 4, -3, 5, 1, 6, 6, 7, 17),
			} as Adjustment,
			9, // ok
			{
				handRotation: Map.of(0, -30, 1, -22, 2, -14, 3, -8, 4, 0, 5, 7, 6, 13, 7, 22, 8, 28),
				positionLeft: Map.of(0, -172, 1, -130, 2, -92, 3, -49, 4, -13, 5, 30, 6, 75, 7, 114, 8, 154),
				positionTop: Map.of(0, 17, 1, 9, 2, 5, 3, 3, 4, 2, 5, 3, 6, 8, 7, 16, 8, 27),
			} as Adjustment,
			10, // ok
			{
				handRotation: Map.of(0, -31, 1, -23, 2, -17, 3, -9, 4, -3, 5, 4, 6, 9, 7, 16, 8, 20, 9, 28),
				positionLeft: Map.of(0, -175, 1, -137, 2, -102, 3, -66, 4, -30, 5, 7, 6, 44, 7, 81, 8, 119, 9, 154),
				positionTop: Map.of(0, 23, 1, 14, 2, 6, 3, 5, 4, 2, 5, -2, 6, 6, 7, 7, 8, 13, 9, 25),
			} as Adjustment,
			11, // ok
			{
				handRotation: Map.of(0, -33, 1, -26, 2, -17, 3, -14, 4, -7, 5, 0, 6, 6, 7, 12, 8, 18, 9, 24, 10, 32),
				positionLeft: Map.of(
					0,
					-178,
					1,
					-144,
					2,
					-108,
					3,
					-72,
					4,
					-40,
					5,
					-6,
					6,
					26,
					7,
					58,
					8,
					94,
					9,
					125,
					10,
					159,
				),
				positionTop: Map.of(0, 22, 1, 16, 2, 10, 3, 10, 4, 9, 5, 9, 6, 10, 7, 15, 8, 19, 9, 28, 10, 38),
			} as Adjustment,
			12,
			{
				handRotation: Map.of(
					0,
					-33,
					1,
					-26,
					2,
					-17,
					3,
					-14,
					4,
					-7,
					5,
					0,
					6,
					6,
					7,
					12,
					8,
					18,
					9,
					24,
					10,
					32,
					11,
					35,
				),
				positionLeft: Map.of(
					0,
					-178,
					1,
					-144,
					2,
					-108,
					3,
					-72,
					4,
					-40,
					5,
					-6,
					6,
					26,
					7,
					58,
					8,
					94,
					9,
					125,
					10,
					159,
					11,
					180,
				),
				positionTop: Map.of(0, 22, 1, 16, 2, 10, 3, 10, 4, 9, 5, 9, 6, 10, 7, 15, 8, 19, 9, 28, 10, 38, 11, 41),
			} as Adjustment,
		);
	}
}

class Adjustment {
	handRotation: Map<number, number>;
	positionLeft: Map<number, number>;
	positionTop: Map<number, number>;

	static create(): Adjustment {
		return {
			handRotation: Map.of(),
			positionLeft: Map.of(),
			positionTop: Map.of(),
		} as Adjustment;
	}
}
