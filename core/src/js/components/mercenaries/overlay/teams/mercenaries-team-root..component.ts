import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, takeUntil, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { isMercenariesPvP } from '../../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../../services/overwolf.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'mercenaries-team-root',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/cdk-overlay.scss`,
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-root.component.scss',
	],
	template: `
		<div class="root overlay-container-parent {{ side }}" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="team-container">
					<div class="team" *ngIf="_team" [style.width.px]="overlayWidthInPx">
						<div class="background"></div>
						<mercenaries-team-control-bar
							[windowId]="windowId"
							[side]="side"
						></mercenaries-team-control-bar>
						<mercenaries-team-list [team]="_team" [tooltipPosition]="tooltipPosition">
						</mercenaries-team-list>
						<div class="footer">
							<div
								class="mouseover-button show-tasks"
								*ngIf="showTasks$ | async"
								(mouseenter)="showTasks()"
								(mouseleave)="hideTasks()"
							>
								<div class="background-main-part"></div>
								<div class="background-second-part"></div>
								<div class="content">
									<div class="icon" inlineSVG="assets/svg/created_by.svg"></div>
									Tasks
								</div>
								<div
									class="task-list {{ tooltipPosition }}"
									[ngClass]="{ 'visible': showTaskList$ | async }"
									[style.bottom.px]="taskListBottomPx"
								>
									<div class="task" *ngFor="let task of _tasks">
										<div
											class="portrait"
											*ngIf="task.mercenaryCardId"
											[cardTooltip]="task.mercenaryCardId"
										>
											<img class="art" [src]="task.portraitUrl" />
											<img class="frame" [src]="task.frameUrl" />
										</div>
										<div class="task-content">
											<div class="header">
												Task {{ task.taskChainProgress + 1 }}: {{ task.title }}
											</div>
											<div class="description">{{ task.description }}</div>
											<div class="progress">
												<div
													class="label"
													helpTooltip="Quest progress at the beginning of the encounter"
												>
													Progress:
												</div>
												<div class="value">{{ task.progress }}</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div
								class="mouseover-button show-roles-matchup-button"
								[cardTooltip]="'merceanries_weakness_triangle'"
								[cardTooltipPosition]="tooltipPosition"
								*ngIf="showColorChart$ | async"
							>
								<div class="background-second-part"></div>
								<div class="background-main-part"></div>
								<div class="content">
									<div class="icon" inlineSVG="assets/svg/created_by.svg"></div>
									Roles chart
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamRootComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	// @Input() teamExtractor: (state: MercenariesBattleState) => MercenariesBattleTeam;
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';
	@Input() trackerPositionUpdater: (left: number, top: number) => void;
	@Input() trackerPositionExtractor: (prefs: Preferences) => { left: number; top: number };
	@Input() defaultTrackerPositionLeftProvider: (gameWidth: number, width: number) => number;
	@Input() defaultTrackerPositionTopProvider: (gameWidth: number, width: number) => number;

	@Input() showTasksExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;

	@Input() set team(value: MercenariesBattleTeam) {
		// console.debug('set team in root', value);
		this._team = value;
		setTimeout(() => {
			this.updateTaskListBottomPx();
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set tasks(value: readonly Task[]) {
		if (!value) {
			return;
		}
		this._tasks = value;
		setTimeout(() => {
			this.updateTaskListBottomPx();
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	showColorChart$: Observable<boolean>;
	showTasks$: Observable<boolean>;
	showTaskList$: Observable<boolean>;

	_team: MercenariesBattleTeam;
	_tasks: readonly Task[];

	windowId: string;
	overlayWidthInPx = 225;
	tooltipPosition: CardTooltipPositionType = 'left';
	taskListBottomPx = 0;

	private gameInfoUpdatedListener: (message: any) => void;

	private scale: Subscription;
	private showTaskList$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.showColorChart$ = this.store
			.listenPrefs$((prefs) => prefs.mercenariesShowColorChartButton)
			.pipe(
				map(([pref]) => pref),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting showColorChart in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.scale = this.store
			.listenPrefs$((prefs) => (!!this.scaleExtractor ? this.scaleExtractor(prefs) : null))
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				console.debug('updating scale', scale);
				this.el.nativeElement.style.setProperty('--decktracker-scale', scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.showTasks$ = combineLatest(
			this.store.listenMercenaries$(([battleState, prefs]) => battleState?.gameMode),
			this.store.listenPrefs$((prefs) => (this.showTasksExtractor ? this.showTasksExtractor(prefs) : null)),
		).pipe(
			// Because when out of combat
			map(([[gameMode], [pref]]) => pref && !isMercenariesPvP(gameMode)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting showTasks in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.showTaskList$ = this.showTaskList$$.asObservable().pipe(
			map((info) => info),
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting showTaskList in ', this.constructor.name, filter)),
			takeUntil(this.destroyed$),
		);
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
				await this.restoreWindowPosition();
			}
		});
		await this.changeWindowSize();
		await this.updateTooltipPosition();
	}

	private async updateTaskListBottomPx() {
		const taskListEl = this.el.nativeElement.querySelector('.task-list');
		console.debug('taskListEl', taskListEl);
		if (!taskListEl) {
			return;
		}

		const rect = taskListEl.getBoundingClientRect();
		console.debug('rect', rect);
		const taskListHeight = rect.height;
		console.debug('taskListHeight', taskListHeight);
		const widgetEl = this.el.nativeElement.querySelector('.team-container');
		console.debug('widgetEl', widgetEl);
		const widgetRect = widgetEl.getBoundingClientRect();
		console.debug('widgetRect', widgetRect);
		const widgetHeight = widgetRect.height;
		console.debug('widgetHeight', widgetHeight);
		this.taskListBottomPx = widgetHeight > taskListHeight ? 0 : widgetHeight - taskListHeight;
		console.debug('taskListBottomPx', this.taskListBottomPx);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.scale?.unsubscribe();
	}

	showTasks() {
		this.showTaskList$$.next(true);
	}

	hideTasks() {
		this.showTaskList$$.next(false);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.tooltipPosition = 'none';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.ow.dragMove(this.windowId, async (result) => {
			await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();

			if (!window) {
				return;
			}

			console.log('updating tracker position', window.left, window.top);
			this.trackerPositionUpdater(window.left, window.top);
		});
	}

	private async changeWindowSize(): Promise<void> {
		const width = 252 * 4.5; // Max scale + room for the tasks list
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
		await this.updateTaskListBottomPx();
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}

		const currentWindow = await this.ow.getCurrentWindow();
		// window.width does not include DPI, see https://overwolf.github.io/docs/topics/windows-resolution-size-position#dpi
		// logical* properties are not DPI aware either, so we should work with them
		const windowWidth = currentWindow.width;
		console.log('window position', currentWindow, gameInfo, windowWidth);

		const prefs = await this.prefs.getPreferences();
		const trackerPosition = this.trackerPositionExtractor(prefs);
		console.log('loaded tracker position', trackerPosition);

		const minAcceptableLeft = -windowWidth / 2;
		const maxAcceptableLeft = gameInfo.logicalWidth - windowWidth / 2;
		const minAcceptableTop = -100;
		const maxAcceptableTop = gameInfo.logicalHeight - 100;
		console.log('acceptable values', minAcceptableLeft, maxAcceptableLeft, minAcceptableTop, maxAcceptableTop);
		const newLogicalLeft = Math.min(
			maxAcceptableLeft,
			Math.max(
				minAcceptableLeft,
				trackerPosition
					? trackerPosition.left || 0
					: this.defaultTrackerPositionLeftProvider(gameInfo.logicalWidth, windowWidth),
			),
		);
		const newLogicalTop = Math.min(
			maxAcceptableTop,
			Math.max(
				minAcceptableTop,
				trackerPosition
					? trackerPosition.top || 0
					: this.defaultTrackerPositionTopProvider(gameInfo.logicalHeight, gameInfo.logicalHeight),
			),
		);
		console.log('updating tracker position', newLogicalLeft, newLogicalTop, gameInfo.logicalWidth, gameInfo.width);
		await this.ow.changeWindowPosition(this.windowId, newLogicalLeft, newLogicalTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
		await this.updateTooltipPosition();
	}

	private async updateTooltipPosition() {
		const window = await this.ow.getCurrentWindow();
		if (!window) {
			return;
		}
		this.tooltipPosition = window.left < 0 ? 'right' : 'left';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export interface Task {
	readonly mercenaryCardId: string;
	readonly title: string;
	readonly description: string;
	readonly taskChainProgress: number;
	readonly progress: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
}
