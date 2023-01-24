import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewRef,
} from '@angular/core';
import { Key } from 'ts-keycode-enum';

@Component({
	selector: 'controls',
	styleUrls: ['./controls.component.scss', '../global.scss'],
	template: `
		<div class="player-controls light-theme">
			<div class="player-controls-buttons-wrapper">
				<div class="player-controls-content player-controls-content-left">
					<span class="gs-icon">
						<svg viewBox="0 0 30 30">
							<path
								d="M24.49,13.1a.34.34,0,0,0,0-.1,5.5,5.5,0,0,0-8.15-4.82A6.49,6.49,0,0,0,5.5,13a.34.34,0,0,0,0,.1A5.5,5.5,0,0,0,8,23.5H22a5.5,5.5,0,0,0,2.49-10.4Z"
								fill="none"
								stroke="currentcolor"
								stroke-linejoin="round"
							/>
							<polyline
								points="11.5,16.5 14.5,19.5 18.5,13.5"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
					<p class="player-controls-content-note" *ngIf="_reviewId">
						<a
							class="player-control-element view-online"
							target="_blank"
							href="https://replays.firestoneapp.com/?reviewId={{ _reviewId }}&source=game-summary"
							>View online</a
						>
					</p>
					<div class="replay-location-text" *ngIf="reviewId">* This replay is stored online</div>
				</div>

				<div
					class="player-controls-content player-controls-content-middle"
					[ngClass]="{ 'player-controls-disabled': !_active }"
				>
					<button
						class="gs-icon player-control-main player-control-element hint-tooltip-container"
						(click)="goPreviousTurn()"
					>
						<svg viewBox="0 0 30 30">
							<polygon points="22 8 12 15 22 22 22 8" fill="currentcolor" />
							<polygon points="15 8 5 15 15 22 15 8" fill="currentcolor" />
						</svg>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Previous turn<br /><kbd>Ctrl</kbd> + <kbd>🡨</kbd></span>
						</div>
					</button>
					<button
						class="gs-icon player-control-main player-control-element hint-tooltip-container"
						(click)="goPreviousAction()"
					>
						<svg viewBox="0 0 30 30">
							<polygon points="20 8 10 15 20 22 20 8" fill="currentcolor" />
							<rect x="9" y="8" width="1" height="14" fill="currentcolor" />
						</svg>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Previous action<br /><kbd>🡨</kbd></span>
						</div>
					</button>
					<button
						class="gs-icon toggle-icons player-control-main player-control-element player-control-play hint-tooltip-container"
						(click)="togglePlayPause()"
					>
						<svg viewBox="0 0 40 40" *ngIf="!isPlaying">
							<polygon points="13,9 31,20 13,31" fill="currentcolor" />
						</svg>
						<svg viewBox="0 0 40 40" *ngIf="isPlaying">
							<rect x="13" y="10" width="5" height="20" fill="currentcolor" />
							/>
							<rect x="22" y="10" width="5" height="20" fill="currentcolor" />
							/>
						</svg>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Play/Pause<br /><kbd>Spacebar</kbd></span>
						</div>
					</button>
					<button
						class="gs-icon player-control-main player-control-element hint-tooltip-container"
						(click)="goNextAction()"
					>
						<svg viewBox="0 0 30 30">
							<polygon points="10 8 20 15 10 22 10 8" fill="currentcolor" />
							<rect x="20" y="8" width="1" height="14" fill="currentcolor" />
						</svg>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Next action<br /><kbd>🡪</kbd></span>
						</div>
					</button>
					<button
						class="gs-icon player-control-main player-control-element hint-tooltip-container"
						(click)="goNextTurn()"
					>
						<svg viewBox="0 0 30 30">
							<polygon points="8,8 18,15 8,22" fill="currentcolor" />
							<polygon points="15,8 25,15 15,22" fill="currentcolor" />
						</svg>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Next turn<br /><kbd>Ctrl</kbd> + <kbd>🡪</kbd></span>
						</div>
					</button>
				</div>

				<div
					class="player-controls-content player-controls-content-right"
					[ngClass]="{ 'player-controls-disabled': !_active }"
				>
					<div class="player-control-group hint-tooltip-container">
						<button
							class="gs-icon btn-gs-icon player-control player-control-element"
							[ngClass]="{ toggled: currentSpeed === 1 }"
							(click)="changeSpeed(1)"
						>
							<span class="player-control-text">1<sub>x</sub></span>
						</button>
						<button
							class="gs-icon btn-gs-icon player-control player-control-element"
							[ngClass]="{ toggled: currentSpeed === 2 }"
							(click)="changeSpeed(2)"
						>
							<span class="player-control-text">2<sub>x</sub></span>
						</button>
						<button
							class="gs-icon btn-gs-icon player-control player-control-element"
							[ngClass]="{ toggled: currentSpeed === 4 }"
							(click)="changeSpeed(4)"
						>
							<span class="player-control-text">4<sub>x</sub></span>
						</button>
						<button
							class="gs-icon btn-gs-icon player-control player-control-element"
							[ngClass]="{ toggled: currentSpeed === 8 }"
							(click)="changeSpeed(8)"
						>
							<span class="player-control-text">8<sub>x</sub></span>
						</button>
						<div class="hint-tooltip hint-tooltip-top dark-theme">
							<span>Playback speed<br /><kbd>Ctrl</kbd> + <kbd>🡩 / 🡫</kbd></span>
						</div>
					</div>
					<div class="gs-icon-divider"></div>
					<button
						class="gs-icon btn-gs-icon player-control player-control-element toggle-icons hint-tooltip-container show"
						[ngClass]="{ show: showingHiddenCards }"
						(click)="toggleShowHiddenCards()"
					>
						<svg viewBox="0 0 30 30" *ngIf="showingHiddenCards">
							<line
								x1="12.5"
								y1="19.5"
								x2="17.5"
								y2="19.5"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<line
								x1="12.5"
								y1="17.5"
								x2="17.5"
								y2="17.5"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<line
								x1="12.5"
								y1="15.5"
								x2="17.5"
								y2="15.5"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<polyline
								points="9.5 7.92 3.72 9.58 7.58 23.04 9.5 22.48"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<polyline
								points="20.5 7.92 26.28 9.58 22.43 23.04 20.5 22.48"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<rect
								x="9.5"
								y="6.5"
								width="11"
								height="16"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<div
							class="hint-tooltip hint-tooltip-top hint-tooltip-aligned-right dark-theme"
							*ngIf="showingHiddenCards"
						>
							<span>Hide hidden cards<br /><kbd>H</kbd></span>
						</div>

						<svg viewBox="0 0 30 30" *ngIf="!showingHiddenCards">
							<polyline
								points="9.5 7.92 3.72 9.58 7.58 23.04 9.5 22.48"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<polyline
								points="20.5 7.92 26.28 9.58 22.43 23.04 20.5 22.48"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<rect
								x="9.5"
								y="6.5"
								width="11"
								height="16"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<line
								x1="4.5"
								y1="25.5"
								x2="25.5"
								y2="4.5"
								fill="none"
								stroke="currentcolor"
								stroke-linecap="round"
								stroke-miterlimit="10"
							/>
						</svg>
						<div
							class="hint-tooltip hint-tooltip-top hint-tooltip-aligned-right dark-theme"
							*ngIf="!showingHiddenCards"
						>
							<span>Show hidden cards<br /><kbd>H</kbd></span>
						</div>
					</button>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent implements OnInit, OnDestroy {
	@Output() nextAction = new EventEmitter<void>();
	@Output() nextTurn = new EventEmitter<void>();
	@Output() previousAction = new EventEmitter<void>();
	@Output() previousTurn = new EventEmitter<void>();
	@Output() showHiddenCards = new EventEmitter<boolean>();

	_active = false;
	_reviewId: string;
	isPlaying = false;
	currentSpeed = 1;
	showingHiddenCards = true;

	private playingTimeout: NodeJS.Timeout;

	constructor(private cdr: ChangeDetectorRef) {}

	ngOnInit() {
		this.startPlayingControl();
	}

	ngOnDestroy() {
		if (this.playingTimeout) {
			clearTimeout(this.playingTimeout);
		}
	}

	@Input() set reviewId(value: string) {
		// reset all the controls
		this.isPlaying = false;
		this.currentSpeed = 1;
		this.showingHiddenCards = true;
		this._reviewId = value;
		// console.log('set review id', this._reviewId);
	}

	@Input() set active(value: boolean) {
		this._active = value;
	}

	@HostListener('document:keyup', ['$event'])
	onKeyPressHandler(event: KeyboardEvent) {
		switch (event.which) {
			case Key.RightArrow:
				event.ctrlKey ? this.goNextTurn() : this.goNextAction();
				break;
			case Key.LeftArrow:
				event.ctrlKey ? this.goPreviousTurn() : this.goPreviousAction();
				break;
			case Key.Space:
				// eslint-disable-next-line no-case-declarations
				const focusedElement = document.activeElement;
				// console.debug('[controls] pressed space while focused on', focusedElement);
				// If the focus is on a player control, we don't trigger the play action,
				// so that the control's action can trigger instead
				if (focusedElement && !focusedElement.classList.contains('player-control-element')) {
					event.stopPropagation();
					this.togglePlayPause();
				}
				break;
			case Key.UpArrow:
				if (event.ctrlKey) {
					this.increaseCurrentSpeed();
				}
				break;
			case Key.DownArrow:
				if (event.ctrlKey) {
					this.decreaseCurrentSpeed();
				}
				break;
			case Key.H:
				this.toggleShowHiddenCards();
				break;
		}
	}

	goPreviousTurn() {
		this.previousTurn.next();
	}

	goPreviousAction() {
		this.previousAction.next();
	}

	goNextAction() {
		this.nextAction.next();
	}

	goNextTurn() {
		this.nextTurn.next();
	}

	togglePlayPause() {
		this.isPlaying = !this.isPlaying;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	changeSpeed(newSpeed: number) {
		this.currentSpeed = newSpeed;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleShowHiddenCards() {
		this.showingHiddenCards = !this.showingHiddenCards;
		this.showHiddenCards.next(this.showingHiddenCards);
	}

	private startPlayingControl() {
		const nextTick = (2.0 / this.currentSpeed) * 1000;
		this.playingTimeout = setTimeout(() => this.startPlayingControl(), nextTick);
		if (this.isPlaying) {
			this.goNextAction();
		}
	}

	private increaseCurrentSpeed() {
		if (this.currentSpeed === 8) {
			return;
		}
		this.currentSpeed *= 2;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private decreaseCurrentSpeed() {
		if (this.currentSpeed === 1) {
			return;
		}
		this.currentSpeed /= 2;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
