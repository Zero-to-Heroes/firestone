/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import { CardIds, GameFormat, GameTag, isBattlegrounds } from '@firestone-hs/reference-data';
import {
	Action,
	BaconBoardVisualStateAction,
	BattlegroundsSimulationParserService,
	CardDiscardAction,
	CardDrawAction,
	CardTargetAction,
	Game,
	GameParserService,
	LocationActivatedAction,
	MinionDeathAction,
	PowerTargetAction,
	Turn,
} from '@firestone-hs/replay-parser';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { groupByFunction2 } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ColiseumDebugService } from '../services/coliseum-debug.service';
import { GameConfService } from '../services/game-conf.service';

const NON_COARSE_ACTIONS = [
	BaconBoardVisualStateAction,
	CardDrawAction,
	PowerTargetAction,
	MinionDeathAction,
	LocationActivatedAction,
	CardDiscardAction,
];

const isSkippedAction = (action: Action): boolean => {
	return (
		action instanceof CardTargetAction &&
		action.entities.get(action.originId)?.cardID === CardIds.BloodGemNoImpactToken
	);
};

@Component({
	selector: 'fs-coliseum',
	styleUrls: ['../global.scss', './coliseum.component.scss'],
	template: `
		<div class="coliseum wide">
			<section class="manastorm-player-wrapper">
				<div class="manastorm-player">
					<div class="aspect-ratio-wrapper ar-16x9">
						<div class="aspect-ratio-inner">
							<ng-container *ngIf="{ currentAction: currentAction$ | async } as value">
								<!-- Allow for an override by the action, for BG sims -->
								<game
									*ngIf="game"
									[gameMode]="gameMode$ | async"
									[playerId]="value.currentAction?.playerId ?? game.players[0].playerId"
									[opponentId]="value.currentAction?.opponentId ?? game.players[1].playerId"
									[playerName]="game.players[0].name"
									[opponentName]="game.players[1].name"
									[currentAction]="value.currentAction"
									[showHiddenCards]="showHiddenCards"
								>
								</game>
							</ng-container>
							<div class="status" *ngIf="status">
								Game is loading. The viewing experience will be optimal once loading is complete.
								{{ status }}...
							</div>
							<preloader
								class="dark-theme"
								[ngClass]="{ active: showPreloader }"
								[status]="status"
							></preloader>

							<sidebar
								class="sidebar"
								[decklist]="decklist"
								[opponentDecklist]="opponentDecklist"
								[game]="game"
								[currentTurn]="currentTurn"
								[currentActionInTurn]="currentActionInTurn"
								(updateCurrentAction)="updateCurrentAction($event)"
							>
							</sidebar>
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
			<turn-narrator
				class="ignored-wrapper"
				[text]="text$ | async"
				[active]="!!game && !showPreloader"
			></turn-narrator>
			<controls
				class="ignored-wrapper"
				[reviewId]="reviewId"
				[active]="!!game && !showPreloader"
				(nextActionDetailed)="onNextAction()"
				(nextAction)="onNextActionCoarse()"
				(nextTurn)="onNextTurn()"
				(previousActionDetailed)="onPreviousAction()"
				(previousAction)="onPreviousActionCoarse()"
				(previousTurn)="onPreviousTurn()"
				(showHiddenCards)="onShowHiddenCards($event)"
			>
			</controls>
			<tooltips></tooltips>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColiseumComponent implements OnDestroy, AfterContentInit {
	@Output() replayLocation = new EventEmitter<ReplayLocation>();

	text$: Observable<string | undefined>;
	gameMode$: Observable<string | undefined>;
	currentAction$: Observable<Action | undefined>;

	@Input() reviewId: string | null;
	@Input() decklist: string | null;
	@Input() opponentDecklist: string | null;
	@Input() set replayXml(value: string | null) {
		if (!value?.length) {
			return;
		}
		this.setReplay(value);
	}
	@Input() set bgsSimulation(value: GameSample | null) {
		if (!value) {
			return;
		}
		this.parseBgsSimulation(value);
	}
	@Input() set initialLocation(value: ReplayLocation) {
		if (!value) {
			return;
		}
		this.currentTurn = value.turn;
		this.currentActionInTurn = value.action;
		console.debug('set initial location', this.currentTurn, this.currentActionInTurn, value);
	}

	status: string | null;
	// text: string | undefined;
	// turnString: string | undefined;
	showHiddenCards = true;
	totalTime: number;
	currentTime = 0;
	showPreloader = true;

	game: Game;

	currentActionInTurn = 0;
	currentTurn = 0;
	private gameSub: Subscription;

	private text$$ = new BehaviorSubject<string | undefined>(undefined);
	private gameMode$$ = new BehaviorSubject<string | undefined>(undefined);
	private currentAction$$ = new BehaviorSubject<Action | undefined>(undefined);

	constructor(
		private readonly gameParser: GameParserService,
		private readonly gameConf: GameConfService,
		private readonly bgsSimulationParser: BattlegroundsSimulationParserService,
		private readonly cdr: ChangeDetectorRef,
		private readonly debugService: ColiseumDebugService,
		private readonly cards: CardsFacadeService,
	) {}

	ngAfterContentInit() {
		this.text$ = this.text$$.asObservable();
		this.gameMode$ = this.gameMode$$.asObservable();
		this.currentAction$ = this.currentAction$$.asObservable();
	}

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
					const turn = this.currentTurn ?? 0;
					const action = this.currentActionInTurn ?? 0;
					this.game = game;
					this.totalTime = this.buildTotalTime();
					if (
						this.currentTurn < this.game.turns.size &&
						this.currentActionInTurn < (this.game.turns?.get(this.currentTurn)?.actions?.length ?? 0)
					) {
						// this.currentTurn = turn <= 0 ? 0 : turn >= this.game.turns.size ? this.game.turns.size - 1 : turn;
						// this.currentActionInTurn =
						// 	action <= 0
						// 		? 0
						// 		: action >= (this.game?.turns?.get(this.currentTurn)?.actions?.length ?? 0)
						// 		? (this.game?.turns?.get(this.currentTurn)?.actions?.length ?? 1) - 1
						// 		: action;
						this.populateInfo(complete);
					}
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

	private async parseBgsSimulation(bgsSimulation: GameSample) {
		this.status = 'Parsing bgsSimulationString simulation';
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		const game = await this.bgsSimulationParser.parse(bgsSimulation);
		console.debug('parsed bgs simulation', game);
		const turn = 0;
		const action = 0;
		this.game = game;
		this.currentTurn = turn <= 0 ? 0 : turn >= this.game.turns.size ? this.game.turns.size - 1 : turn;
		this.currentActionInTurn =
			action <= 0
				? 0
				: action >= this.game.turns.get(this.currentTurn)!.actions.length
				? this.game.turns.get(this.currentTurn)!.actions.length - 1
				: action;
		this.populateInfo(true);
		this.showPreloader = false;
		this.status = null;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	// private updateStatus(newStatus: string) {
	// 	// console.debug('updating status', newStatus);
	// 	this.status = newStatus;
	// 	if (!(this.cdr as ViewRef).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	ngOnDestroy() {
		this.gameSub.unsubscribe();
	}

	onNextAction() {
		this.moveCursorToNextAction();
	}

	onNextActionCoarse() {
		this.moveCursorToNextActionCoarse();
	}

	onNextTurn() {
		this.moveCursorToNextTurn();
	}

	onPreviousAction() {
		this.moveCursorToPreviousAction();
	}

	onPreviousActionCoarse() {
		this.moveCursorToPreviousActionCoarse();
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
		// console.debug('[app] seeking target timestamp', targetTimestamp);
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
		this.updateCurrentAction({ turn: lastTurnIndex, action: lastActionIndex });
		// So that the value is always what the user actually selected, and there are no weird jumps
		this.currentTime = targetTimestamp;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	updateCurrentAction(location: { turn: number; action: number } | null) {
		if (!location) {
			return;
		}
		// console.debug(
		this.currentTurn = location.turn;
		this.currentActionInTurn = location.action;
		// console.debug(
		// 	'[app] finished seeking',
		// 	this.currentTurn,
		// 	this.currentActionInTurn,
		// 	this.game.turns.toJS(),
		// 	this.game.turns.get(this.currentTurn)?.actions,
		// );
		this.populateInfo();
	}

	private async populateInfo(complete = true) {
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

		const currentAction = this.game.turns.get(this.currentTurn)?.actions[this.currentActionInTurn];
		// console.debug('current action', currentAction, this.currentTurn, this.currentActionInTurn);
		this.currentAction$$.next(currentAction);
		this.text$$.next(this.computeText());
		const gameMode = this.computeGameMode();
		this.gameMode$$.next(gameMode);

		// This avoid truncating the query string because we don't have all the info yet
		if (complete) {
			this.currentTime = this.computeCurrentTime();
			this.updateUrlQueryString();

			if (gameMode !== 'battlegrounds') {
				const opponentHeroEntity = this.game.players[1].getTag(GameTag.HERO_ENTITY);
				const opponentCards = this.game
					.getLatestParsedState()
					.valueSeq()
					.filter(
						(entity) =>
							entity.getTag(GameTag.CONTROLLER) === this.game.players[1].playerId &&
							entity.id !== opponentHeroEntity &&
							entity.cardID &&
							!entity.getTag(GameTag.CREATOR) &&
							!entity.getTag(GameTag.CREATOR_DBID),
					)
					.toArray();
				const cardIds = opponentCards.map((e) => e.cardID);
				const groupedByCardId = groupByFunction2(cardIds, (cardId) => cardId);
				const deckDefinition: DeckDefinition = {
					heroes: [7],
					format: GameFormat.FT_WILD,
					cards: Object.values(groupedByCardId).map((group) => {
						const dbfId = this.cards.getCard(group[0])?.dbfId;
						return [dbfId, group.length];
					}),
				};
				const deckstring = encode(deckDefinition);
				this.opponentDecklist = deckstring;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
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
		// if (isBattlegroundsDuo(this.game.gameType)) {
		// 	return 'battlegrounds-duo';
		// }
		if (isBattlegrounds(this.game.gameType)) {
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

	private moveCursorToNextAction() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (
			this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 1) - 1 &&
			this.currentTurn >= this.game.turns.size - 1
		) {
			return;
		}
		this.currentActionInTurn++;
		if (this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 0)) {
			this.currentActionInTurn = 0;
			this.currentTurn++;
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

	private moveCursorToNextActionCoarse() {
		if (!this.game || !this.game.turns) {
			return;
		}
		if (
			this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 1) - 1 &&
			this.currentTurn >= this.game.turns.size - 1
		) {
			return;
		}
		this.currentActionInTurn++;
		if (this.currentActionInTurn >= (this.game.turns.get(this.currentTurn)?.actions?.length ?? 0)) {
			this.currentActionInTurn = 0;
			this.currentTurn++;
		}
		const currentTurn = this.game.turns.get(this.currentTurn);
		if (!currentTurn) {
			return;
		}

		const currentAction = currentTurn.actions[this.currentActionInTurn];
		if (NON_COARSE_ACTIONS.some((cls) => currentAction instanceof cls) || isSkippedAction(currentAction)) {
			this.moveCursorToNextActionCoarse();
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

	private moveCursorToPreviousActionCoarse() {
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

		const currentAction = currentTurn.actions[this.currentActionInTurn];
		if (NON_COARSE_ACTIONS.some((cls) => currentAction instanceof cls) || isSkippedAction(currentAction)) {
			this.moveCursorToPreviousActionCoarse();
			return;
		}

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private moveCursorToNextTurn() {
		const start = Date.now();
		// console.debug('moving cursor', this.currentTurn, this.game.turns.size);
		if (!this.game || !this.game.turns) {
			return;
		}
		if (this.currentTurn >= this.game.turns.size - 1) {
			return;
		}
		this.currentActionInTurn = 0;
		this.currentTurn++;
		this.populateInfo();

		// console.debug('moved cursor', Date.now() - start, this.currentTurn, this.game.turns.size);
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
		// if (!(this.cdr as ViewRef).destroyed) {
		// 	this.cdr.detectChanges();
		// }
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

	private updateUrlQueryString() {
		this.replayLocation.next({
			turn: this.currentTurn,
			action: this.currentActionInTurn,
		});
	}
}

export interface ReplayLocation {
	readonly turn: number;
	readonly action: number;
}
