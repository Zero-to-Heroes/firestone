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
import { Game } from '@firestone/replay/replay-parser';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, distinctUntilChanged, Observable } from 'rxjs';
import { EventsLogEntry } from '../../services/replay-timeline.model';
import { ReplayTimelineService } from '../../services/replay-timeline.service';

@Component({
	standalone: false,
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

	logs$: Observable<EventsLogEntry[]>;

	@Input() set game(value: Game) {
		this.game$$.next(value);
	}
	@Input() set totalDuration(value: number) {
		this.totalDuration$$.next(value ?? 0);
	}
	@Input() set currentTurn(value: number) {
		this.currentTurn$$.next(value);
	}
	@Input() set currentActionInTurn(value: number) {
		this.currentActionInTurn$$.next(value);
	}

	private game$$ = new BehaviorSubject<Game | null>(null);
	private totalDuration$$ = new BehaviorSubject<number>(0);
	private currentTurn$$ = new BehaviorSubject<number>(0);
	private currentActionInTurn$$ = new BehaviorSubject<number>(0);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly replayTimelineService: ReplayTimelineService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		const rawLogs$ = combineLatest([this.game$$, this.totalDuration$$]).pipe(
			this.mapData(([game, totalDuration]) => {
				if (!game) {
					return [];
				}
				const duration = totalDuration || this.replayTimelineService.computeTotalDuration(game);
				return this.replayTimelineService.buildEventsLog(game, duration);
			}),
		);
		this.logs$ = combineLatest([rawLogs$, this.currentTurn$$, this.currentActionInTurn$$]).pipe(
			distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]),
			this.mapData(([rawLogs, currentTurn, currentActionInTurn]) =>
				rawLogs.map((log) => {
					if (
						currentTurn < log.turnNumber ||
						(currentTurn === log.turnNumber && currentActionInTurn < log.actionNumber)
					) {
						return { ...log, dimmed: true };
					}
					return log;
				}),
			),
		);
	}

	trackByFn(index: number, item: EventsLogEntry): string {
		return '' + item.turnNumber + item.actionNumber;
	}

	goToAction(log: EventsLogEntry) {
		this.updateCurrentAction.emit({ turn: log.turnNumber, action: log.actionNumber });
	}
}
