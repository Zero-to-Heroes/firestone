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
import { CardPlayedFromHandAction, Game } from '@firestone-hs/replay-parser';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

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
		this.currentActionInTurn$$.next(value);
	}

	private game$$ = new BehaviorSubject<Game | null>(null);
	private currentTurn$$ = new BehaviorSubject<number>(0);
	private currentActionInTurn$$ = new BehaviorSubject<number>(0);

	constructor(protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		// Build the log, turn by turn, action by action, and map each section to a turn / action
		const rawLogs$ = this.game$$.pipe(
			this.mapData((game) => {
				if (!game) {
					return [];
				}
				// Process the game data to build the events log
				// This is where you would implement the logic to extract and display events from the game
				console.log('Game data received:', game);
				const player = game.players[0];
				const opponent = game.players[1];
				const logs: ActionHistory[] = game.turns
					.entrySeq()
					.map(([turnNumber, turn]) => {
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
							activePlayer: activePlayerName,
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
									activePlayer: activePlayerName,
									text: action.textRaw.split('\t').filter((t) => !!t?.length)[0],
								};
								return result;
							})
							.filter((a) => !!a) as ActionHistory[];
						logsForTurn.push(...turnActions);
						return logsForTurn;
					})
					.toArray()
					.flat();
				console.debug('Turn history:', logs);
				return logs;
			}),
		);
		this.logs$ = combineLatest([rawLogs$, this.currentTurn$$, this.currentActionInTurn$$]).pipe(
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
		return item.turnNumber + (item.activePlayer ?? '') + item.text;
	}

	goToAction(log: ActionHistory) {
		this.updateCurrentAction.emit({ turn: log.turnNumber, action: log.actionNumber });
	}
}

interface ActionHistory {
	type: 'turn' | 'action';
	turnNumber: number;
	actionNumber: number;
	isPlayer: boolean;
	activePlayer: string | null;
	text: string;
	dimmed?: boolean;
}
