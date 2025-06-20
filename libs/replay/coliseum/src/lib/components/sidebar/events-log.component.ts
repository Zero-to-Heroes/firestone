/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import {
	ActionButtonUsedAction,
	BaconBoardVisualStateAction,
	CardPlayedFromHandAction,
	Game,
} from '@firestone-hs/replay-parser';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, distinctUntilChanged, Observable, tap } from 'rxjs';

@Component({
	selector: 'events-log',
	styleUrls: ['../../global.scss', './events-log.component.scss'],
	template: `
		<div class="events-log">
			<div
				class="log"
				*ngFor="let log of logs$ | async; trackBy: trackByFn"
				[ngClass]="{
					dimmed: log.dimmed,
					action: log.type === 'action',
					turn: log.type === 'turn',
					player: log.isPlayer
				}"
				(click)="goToAction(log)"
			>
				<div class="text">{{ log.text }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsLogComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Output() updateCurrentAction = new EventEmitter<{ turn: number; action: number } | null>();

	logs$: Observable<ActionHistory[]>;

	@Input() set game(value: Game) {
		this.game$$.next(value);
	}
	@Input() set currentTurn(value: number) {
		this.currentTurn$$.next(value);
	}
	@Input() set currentActionInTurn(value: number) {
		console.debug('Setting current action in turn', value);
		this.currentActionInTurn$$.next(value);
	}

	private game$$ = new BehaviorSubject<Game | null>(null);
	private currentTurn$$ = new BehaviorSubject<number>(0);
	private currentActionInTurn$$ = new BehaviorSubject<number>(0);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	// TODO: BG
	ngAfterContentInit(): void {
		// Build the log, turn by turn, action by action, and map each section to a turn / action
		const rawLogs$ = this.game$$.pipe(
			// debounceTime(200),
			this.mapData((game) => {
				if (!game) {
					return [];
				}

				const isBg = isBattlegrounds(game.gameType);
				return isBg ? this.buildBattlegroundsEventsLog(game) : this.buildEventsLog(game);
			}),
		);
		this.logs$ = combineLatest([rawLogs$, this.currentTurn$$, this.currentActionInTurn$$]).pipe(
			distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]),
			tap(([rawLogs, currentTurn, currentActionInTurn]) =>
				console.debug('Current turn/action:', currentTurn, currentActionInTurn),
			),
			this.mapData(([rawLogs, currentTurn, currentActionInTurn]) => {
				const result = rawLogs.map((log) => {
					if (
						currentTurn < log.turnNumber ||
						(currentTurn === log.turnNumber && currentActionInTurn < log.actionNumber)
					) {
						return { ...log, dimmed: true };
					}
					return log;
				});
				console.debug('Processed logs:', result, currentTurn, currentActionInTurn);
				return result;
			}),
		);
	}

	trackByFn(index: number, item: ActionHistory): string {
		return '' + item.turnNumber + item.actionNumber;
	}

	goToAction(log: ActionHistory) {
		this.updateCurrentAction.emit({ turn: log.turnNumber, action: log.actionNumber });
	}

	private buildEventsLog(game: Game): ActionHistory[] {
		// Process the game data to build the events log
		// This is where you would implement the logic to extract and display events from the game
		// console.log('Game data received:', game);
		const player = game.players[0];
		const opponent = game.players[1];
		const logs: ActionHistory[] = game.turns
			.entrySeq()
			.map(([turnNumber, turn]) => {
				if (!turn.actions?.length) {
					// console.warn('No actions for turn', turnNumber, turn);
					return [];
				}

				const activePlayerName =
					turnNumber === 0
						? ''
						: turn.actions[0].activePlayer === player.playerId
						? player.name
						: opponent.name;
				const isPlayer = turn.actions[0].activePlayer === player.playerId;
				const logsForTurn: ActionHistory[] = [];
				logsForTurn.push({
					turnNumber: turnNumber,
					actionNumber: 0,
					isPlayer: isPlayer,
					type: 'turn' as const,
					// activePlayer: activePlayerName,
					text:
						turnNumber === 0
							? turn.actions[0].textRaw
							: `Turn ${Math.ceil(turnNumber / 2)} - ${activePlayerName}`,
				});
				const turnActions: ActionHistory[] = turn.actions
					.map((action, actionIndex) => {
						if (!(action instanceof CardPlayedFromHandAction)) {
							return null;
						}
						const result: ActionHistory = {
							turnNumber: turnNumber,
							actionNumber: actionIndex,
							isPlayer: isPlayer,
							type: 'action' as const,
							// activePlayer: activePlayerName,
							text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
						};
						return result;
					})
					.filter((a) => !!a) as ActionHistory[];
				logsForTurn.push(...turnActions);
				return logsForTurn;
			})
			.toArray()
			.flat()
			.sort((a, b) => a.turnNumber - b.turnNumber || a.actionNumber - b.actionNumber);
		// console.debug('Turn history:', logs);
		return logs;
	}

	private buildBattlegroundsEventsLog(game: Game): ActionHistory[] {
		// Process the game data to build the events log
		// This is where you would implement the logic to extract and display events from the game
		// console.log('BG Game data received:', game);
		const logs: ActionHistory[] = game.turns
			.entrySeq()
			.map(([turnNumber, turn]) => {
				if (!turn.actions?.length) {
					// console.warn('No actions for turn', turnNumber, turn);
					return [];
				}
				// Nothing happens here, I think it's just the validation of the hero selection
				if (turnNumber === 1) {
					return [];
				}

				const logsForTurn: ActionHistory[] = [];
				if (turnNumber === 0) {
					logsForTurn.push({
						turnNumber: turnNumber,
						actionNumber: 0,
						isPlayer: false,
						type: 'turn' as const,
						// activePlayer: activePlayerName,
						text: 'Hero selection',
					});
					return logsForTurn;
				}
				const turnActions: ActionHistory[] = turn.actions
					.map((action, actionIndex) => {
						if (action instanceof BaconBoardVisualStateAction) {
							// Not sure why, but it looks like a timing issue in the logs?
							const displayTurnNumber =
								turnNumber === 3 && action.newState === 2 ? turnNumber - 1 : turnNumber;
							const phaseAction: ActionHistory = {
								turnNumber: turnNumber,
								actionNumber: actionIndex,
								// Highlight recruits
								isPlayer: action.newState !== 1,
								type: 'turn' as const,
								// activePlayer: activePlayerName,
								text: `Turn ${Math.ceil(displayTurnNumber / 2)} - ${action.textRaw}`,
							};
							return phaseAction;
						}
						if (action instanceof ActionButtonUsedAction) {
							const result: ActionHistory = {
								turnNumber: turnNumber,
								actionNumber: actionIndex,
								isPlayer: false,
								type: 'action' as const,
								// activePlayer: activePlayerName,
								text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
							};
							return result;
						}
						return null;
					})
					.filter((a) => !!a) as ActionHistory[];
				logsForTurn.push(...turnActions);
				return logsForTurn;
			})
			.toArray()
			.flat()
			.sort((a, b) => a.turnNumber - b.turnNumber || a.actionNumber - b.actionNumber);
		// console.debug('Turn history:', logs);
		return logs;
	}
}

interface ActionHistory {
	type: 'turn' | 'action';
	turnNumber: number;
	actionNumber: number;
	isPlayer: boolean;
	// activePlayer: string | null;
	text: string;
	dimmed?: boolean;
}
