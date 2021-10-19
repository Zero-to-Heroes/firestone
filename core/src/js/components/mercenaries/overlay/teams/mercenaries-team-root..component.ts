import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { isMercenariesPvP } from '../../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../../services/overwolf.service';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-team-root',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/cdk-overlay.scss`,
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-root.component.scss',
	],
	template: `
		<div class="root overlay-container-parent" [activeTheme]="'decktracker'">
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
											<div class="header">{{ task.title }}</div>
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
								[cardTooltip]="'pokemon_diagram'"
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
export class MercenariesTeamRootComponent implements AfterViewInit, OnDestroy {
	// @Input() teamExtractor: (state: MercenariesBattleState) => MercenariesBattleTeam;
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';
	@Input() trackerPositionUpdater: (left: number, top: number) => void;
	@Input() trackerPositionExtractor: (prefs: Preferences) => { left: number; top: number };
	@Input() defaultTrackerPositionLeftProvider: (gameWidth: number, width: number) => number;
	@Input() defaultTrackerPositionTopProvider: (gameWidth: number, width: number) => number;
	@Input() showTasksExtractor: (prefs: Preferences) => boolean;

	@Input() set team(value: MercenariesBattleTeam) {
		// console.debug('set team in root', value);
		this._team = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set tasks(value: readonly Task[]) {
		// console.debug('set team in root', value);
		this._tasks = value;
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

	private gameInfoUpdatedListener: (message: any) => void;
	private showTaskList$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.showColorChart$ = this.store
			.listenPrefs$((prefs) => prefs.mercenariesShowColorChartButton)
			.pipe(
				map(([pref]) => pref),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting showColorChart in ', this.constructor.name, filter)),
			);
		this.showTasks$ = combineLatest(
			this.store.listenMercenaries$(([battleState, prefs]) => battleState?.gameMode),
			this.store.listenPrefs$((prefs) => this.showTasksExtractor(prefs)),
		).pipe(
			tap((info) => console.debug('info', info)),
			// Because when out of combat
			map(([[gameMode], [pref]]) => pref && !isMercenariesPvP(gameMode)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting showTasks in ', this.constructor.name, filter)),
		);
		this.showTaskList$ = this.showTaskList$$.asObservable().pipe(
			map((info) => info),
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting showTaskList in ', this.constructor.name, filter)),
		);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
				await this.restoreWindowPosition();
			}
		});
		await this.changeWindowSize();
		await this.updateTooltipPosition();
	}

	ngOnDestroy() {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
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
		const width = 252 * 3.5; // Max scale + room for the tasks list
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		await this.restoreWindowPosition();
		await this.updateTooltipPosition();
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
	readonly progress: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
}
