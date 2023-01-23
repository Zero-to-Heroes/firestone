import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewRef } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { Action, BaconBoardVisualStateAction, Game, GameParserService, Turn } from '@firestone-hs/replay-parser';
import { Subscription } from 'rxjs';
import { GameConfService } from '../services/game-conf.service';

@Component({
	selector: 'fs-coliseum',
	styleUrls: ['../global.scss', './coliseum.component.scss'],
	template: `
		<div class="coliseum wide">
			<section class="manastorm-player-wrapper">
				<div class="manastorm-player">
					<div class="aspect-ratio-wrapper ar-16x9">
						<div class="aspect-ratio-inner">
							<game
								*ngIf="game"
								[gameMode]="gameMode"
								[playerId]="game.players[0].playerId"
								[opponentId]="game.players[1].playerId"
								[playerName]="game.players[0].name"
								[opponentName]="game.players[1].name"
								[currentAction]="currentAction"
								[showHiddenCards]="showHiddenCards"
							>
							</game>
							<div class="status" *ngIf="status">
								Game is loading. The viewing experience will be optimal once loading is complete.
								{{ status }}...
							</div>
							<preloader
								class="dark-theme"
								[ngClass]="{ active: showPreloader }"
								[status]="status"
							></preloader>
						</div>
					</div>
				</div>
			</section>
			<seeker
				class="ignored-wrapper"
				[totalTime]="totalTime"
				[currentTime]="currentTime"
				[active]="!!game && !showPreloader"
				(seek)="onSeek($event)"
			>
			</seeker>
			<turn-narrator class="ignored-wrapper" [text]="text" [active]="!!game && !showPreloader"></turn-narrator>
			<controls
				class="ignored-wrapper"
				[reviewId]="reviewId"
				[active]="!!game && !showPreloader"
				(nextAction)="onNextAction()"
				(nextTurn)="onNextTurn()"
				(previousAction)="onPreviousAction()"
				(previousTurn)="onPreviousTurn()"
				(showHiddenCards)="onShowHiddenCards($event)"
			>
			</controls>
			<tooltips></tooltips>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColiseumComponent implements OnDestroy {
	@Input() reviewId: string;
	@Input() set replayXml(value: string) {
		this.setReplay(value);
	}

	bgsSimulationString: string;
	bgsSimulationId: string;
	status: string | null;
	currentAction: Action | undefined;
	text: string | undefined;
	turnString: string | undefined;
	showHiddenCards = true;
	totalTime: number;
	currentTime = 0;
	showPreloader = true;
	gameMode: string | undefined;

	game: Game;

	private currentActionInTurn = 0;
	private currentTurn = 0;
	private gameSub: Subscription;

	constructor(
		private gameParser: GameParserService,
		private gameConf: GameConfService,
		private cdr: ChangeDetectorRef,
	) {}

	private async setReplay(replayXml: string) {
		this.gameParser.cancelProcessing();
		if (this.gameSub) {
			this.gameSub.unsubscribe();
		}

		this.status = 'Parsing replay file';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}

		const gameObs = await this.gameParser.parse(replayXml);
		// console.log('gameObs', gameObs);
		this.gameSub = gameObs.subscribe(
			([game, status, complete]: [Game, string, boolean]) => {
				this.status = status || this.status;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
				if (game) {
					// Since the user can already navigate before the game is fully loaded, we want
					// to restore the navigation to where the user currently is
					const turn = 0;
					const action = 0;
					this.game = game;
					this.totalTime = this.buildTotalTime();
					this.currentTurn = turn <= 0 ? 0 : turn >= this.game.turns.size ? this.game.turns.size - 1 : turn;
					this.currentActionInTurn =
						action <= 0
							? 0
							: action >= (this.game?.turns?.get(this.currentTurn)?.actions?.length ?? 0)
							? (this.game?.turns?.get(this.currentTurn)?.actions?.length ?? 1) - 1
							: action;
					this.populateInfo(complete);
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}

					if (complete) {
						this.status = null;
						console.log('[app] Received complete game', game.turns.size);
					}

					// We do this so that the initial drawing is already done when hiding the preloader
					setTimeout(() => {
						this.showPreloader = false;
						if (!game || !game.turns || (game.turns.size === 0 && complete)) {
							console.log('showing error status because no turns');
							this.status = 'error';
							this.showPreloader = true;
						}
						if (!(this.cdr as ViewRef).destroyed) {
							this.cdr.detectChanges();
						}
					}, 1500);
				} else {
					console.log('showing error status because no game');
					this.showPreloader = true;
					this.status = 'error';
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				}
			},
			(error) => {
				console.error('Could not parse replay', error);
				this.status = 'error';
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			},
		);
	}

	public updateStatus(newStatus: string) {
		console.log('updating status', newStatus);
		this.status = newStatus;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		this.gameSub.unsubscribe();
	}

	onNextAction() {
		this.moveCursorToNextAction();
	}

	onNextTurn() {
		this.moveCursorToNextTurn();
	}

	onPreviousAction() {
		this.moveCursorToPreviousAction();
	}

	onPreviousTurn() {
		this.moveCursorToPreviousTurn();
	}

	onShowHiddenCards(event) {
		this.showHiddenCards = event;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSeek(targetTimestamp: number) {
		if (!this.game) {
			console.warn('[app] game not present, not performing operation', 'onSeek');
			return;
		}
		console.debug('[app] seeking target timestamp', targetTimestamp);
		let lastActionIndex = 0;
		let lastTurnIndex = 0;
		for (let turnIndex = 0; turnIndex < this.game.turns.size; turnIndex++) {
			const turn = this.game.turns.get(turnIndex);
			if (!turn) {
				continue;
			}
			for (let actionIndex = 0; actionIndex < turn?.actions.length; actionIndex++) {
				const action = turn.actions[actionIndex];
				if (action.timestamp > targetTimestamp) {
					break;
				}
				lastActionIndex = actionIndex;
				lastTurnIndex = turnIndex;
			}
		}
		this.currentTurn = lastTurnIndex;
		this.currentActionInTurn = lastActionIndex;
		console.debug(
			'[app] finished seeking',
			this.currentTurn,
			this.currentActionInTurn,
			this.game.turns.toJS(),
			this.game.turns.get(this.currentTurn)?.actions,
		);
		this.populateInfo();
		// So that the value is always what the user actually selected, and there are no weird jumps
		this.currentTime = targetTimestamp;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private populateInfo(complete = true) {
		this.gameConf.updateConfig(this.game);
		if (
			!this.game ||
			!this.game.turns ||
			!this.game.turns.has(this.currentTurn) ||
			!this.game.turns.get(this.currentTurn)?.actions ||
			!this.game.turns.get(this.currentTurn)?.actions[this.currentActionInTurn]
		) {
			console.debug(
				'[app] nothing to process',
				this.game.turns,
				this.currentTurn,
				this.game.turns.get(this.currentTurn),
			);
			return;
		}

		this.currentAction = this.game.turns.get(this.currentTurn)?.actions[this.currentActionInTurn];
		this.text = this.computeText();
		this.turnString = this.computeTurnString();
		this.gameMode = this.computeGameMode();
		// This avoid truncating the query string because we don't have all the info yet
		if (complete) {
			this.currentTime = this.computeCurrentTime();
		}
	}

	private buildTotalTime() {
		if (!this.game) {
			return 0;
		}
		const lastTurn: Turn | undefined = this.game.turns.get(this.game.turns.size - 1);
		if (!lastTurn) {
			return 0;
		}
		for (let i = lastTurn.actions.length - 1; i >= 0; i--) {
			const lastAction = lastTurn.actions[i];
			if (lastAction.timestamp) {
				return lastAction.timestamp;
			}
		}
		return 0;
	}

	private computeCurrentTime(): number {
		if (!this.game) {
			console.warn('[app] game not present, not performing operation', 'computeCurrentTime');
			return 0;
		}
		const currentTime = this.game.turns.get(this.currentTurn)?.actions[this.currentActionInTurn].timestamp ?? 0;
		return currentTime;
	}

	private computeGameMode(): string | undefined {
		if (!this.game) {
			console.warn('[app] game not present, not performing operation', 'computeGameMode');
			return undefined;
		}
		if (
			this.game.gameType === GameType.GT_BATTLEGROUNDS ||
			this.game.gameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
		) {
			return 'battlegrounds';
		}
		return undefined;
	}

	private computeText(): string | undefined {
		if (!this.game) {
			console.warn('[app] game not present, not performing operation', 'computeText');
			return undefined;
		}
		return this.game.turns.get(this.currentTurn)?.actions[this.currentActionInTurn]?.textRaw;
	}

	private computeTurnString(): string | undefined {
		if (!this.game) {
			console.warn('[app] game not present, not performing operation', 'computeTurnString');
			return undefined;
		}
		return this.game.turns.get(this.currentTurn)?.turn === 'mulligan'
			? 'Mulligan'
			: `Turn${this.game.turns.get(this.currentTurn)?.turn}`;
	}

	private moveCursorToNextAction() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (
			this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 1) - 1 &&
			this.currentTurn >= this.game.turns.size - 1
		) {
			// console.log(
			// 	'cannot go further',
			// 	this.currentActionInTurn,
			// 	this.currentTurn,
			// 	this.game.turns.size,
			// 	this.game.turns.toJS(),
			// );
			return;
		}
		this.currentActionInTurn++;
		if (this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 0)) {
			this.currentActionInTurn = 0;
			this.currentTurn++;
			// console.log('went further', this.currentTurn, this.currentActionInTurn);
		}
		const currentTurn = this.game.turns.get(this.currentTurn);
		if (!currentTurn) {
			return;
		}

		if (
			currentTurn.actions.length === 0 ||
			(currentTurn.actions.length === 1 && currentTurn.actions[0] instanceof BaconBoardVisualStateAction)
		) {
			this.moveCursorToNextAction();
			return;
		}
		this.populateInfo();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private moveCursorToPreviousAction() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (this.currentActionInTurn === 0 && this.currentTurn === 0) {
			return;
		}
		this.currentActionInTurn--;
		if (this.currentActionInTurn < 0) {
			this.currentTurn--;
			this.currentActionInTurn = (this.game.turns.get(this.currentTurn)?.actions.length ?? 1) - 1;
		}
		this.populateInfo();
		const currentTurn = this.game.turns.get(this.currentTurn);
		if (!currentTurn) {
			return;
		}

		if (
			currentTurn.actions.length === 0 ||
			(currentTurn.actions.length === 1 && currentTurn.actions[0] instanceof BaconBoardVisualStateAction)
		) {
			this.moveCursorToPreviousAction();
			return;
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private moveCursorToNextTurn() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (this.currentTurn >= this.game.turns.size - 1) {
			return;
		}
		this.currentActionInTurn = 0;
		this.currentTurn++;
		this.populateInfo();
		const currentTurn = this.game.turns.get(this.currentTurn);
		if (!currentTurn) {
			return;
		}

		if (
			currentTurn.actions.length === 0 ||
			(currentTurn.actions.length === 1 && currentTurn.actions[0] instanceof BaconBoardVisualStateAction)
		) {
			this.moveCursorToNextTurn();
			return;
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private moveCursorToPreviousTurn() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (this.currentTurn === 0) {
			return;
		}
		this.currentActionInTurn = 0;
		this.currentTurn--;
		this.populateInfo();
		const currentTurn = this.game.turns.get(this.currentTurn);
		if (!currentTurn) {
			return;
		}

		if (
			currentTurn.actions.length === 0 ||
			(currentTurn.actions.length === 1 && currentTurn.actions[0] instanceof BaconBoardVisualStateAction)
		) {
			this.moveCursorToPreviousTurn();
			return;
		}
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
