import {
	AfterContentInit,
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
		<div class="root {{ side }}">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="team-container">
					<div class="team" *ngIf="_team" [style.width.px]="overlayWidthInPx">
						<div class="background"></div>
						<mercenaries-team-control-bar [side]="side"></mercenaries-team-control-bar>
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
									{{ 'mercenaries.team-widget.tasks-button' | owTranslate }}
								</div>
								<mercs-tasks-list
									class="task-list {{ tooltipPosition }}"
									[ngClass]="{ 'visible': showTaskList$ | async }"
									[style.bottom.px]="taskListBottomPx"
									[tasks]="_tasks"
								></mercs-tasks-list>
							</div>

							<div
								class="mouseover-button show-roles-matchup-button"
								[cardTooltip]="'merceanries_weakness_triangle'"
								[cardTooltipPosition]="tooltipPosition"
								[cardTooltipClass]="'mercenaries-weakness-triangle'"
								[cardTooltipLocalized]="false"
								*ngIf="showColorChart$ | async"
							>
								<div class="background-second-part"></div>
								<div class="background-main-part"></div>
								<div class="content">
									<div class="icon" inlineSVG="assets/svg/created_by.svg"></div>
									{{ 'mercenaries.team-widget.roles-chart-button' | owTranslate }}
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
export class MercenariesTeamRootComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';
	@Input() showTasksExtractor: (prefs: Preferences) => boolean;
	@Input() scaleExtractor: (prefs: Preferences) => number;

	@Input() set team(value: MercenariesBattleTeam) {
		this._team = value;
		this.updateTaskListBottomPx();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set tasks(value: readonly Task[]) {
		if (!value) {
			return;
		}
		this._tasks = value;
		this.updateTaskListBottomPx();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	showColorChart$: Observable<boolean>;
	showTasks$: Observable<boolean>;
	showTaskList$: Observable<boolean>;

	_team: MercenariesBattleTeam;
	_tasks: readonly Task[];

	overlayWidthInPx = 225;
	taskListBottomPx = 0;

	private scale: Subscription;
	private showTaskList$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
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
	}

	trackByTaskFn(index: number, task: Task) {
		return task.description;
	}

	private updateTaskListBottomPx() {
		setTimeout(() => {
			const taskListEl = this.el.nativeElement.querySelector('.task-list');
			if (!taskListEl) {
				return;
			}

			const taskEls = this.el.nativeElement.querySelectorAll('.task');
			if (taskEls?.length != this._tasks?.length) {
				setTimeout(() => this.updateTaskListBottomPx(), 100);
				return;
			}

			const rect = taskListEl.getBoundingClientRect();
			const taskListHeight = rect.height;
			const widgetEl = this.el.nativeElement.querySelector('.team-container');
			const widgetRect = widgetEl.getBoundingClientRect();
			const widgetHeight = widgetRect.height;
			this.taskListBottomPx = widgetHeight > taskListHeight ? 0 : widgetHeight - taskListHeight;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 100);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.scale?.unsubscribe();
	}

	showTasks() {
		this.showTaskList$$.next(true);
	}

	hideTasks() {
		this.showTaskList$$.next(false);
	}
}

@Component({
	selector: 'mercs-tasks-list',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-root.component.scss',
	],
	template: `
		<div class="tasks-container">
			<ng-container *ngIf="tasks?.length; else emptyState">
				<div class="task" *ngFor="let task of tasks; trackBy: trackByTaskFn">
					<div class="portrait" *ngIf="task.mercenaryCardId" [cardTooltip]="task.mercenaryCardId">
						<img class="art" [src]="task.portraitUrl" />
						<img class="frame" *ngIf="task.frameUrl" [src]="task.frameUrl" />
					</div>
					<div class="task-content">
						<div class="header">{{ task.header }}</div>
						<div class="description">{{ task.description }}</div>
						<div class="progress">
							<div class="background"></div>
							<div class="current-progress" [style.width.%]="task.progressPercentage"></div>
							<div class="text">{{ task.progress }} / {{ task.quota }}</div>
						</div>
					</div>
				</div>
			</ng-container>
			<ng-template #emptyState
				><div class="empty-state" [owTranslate]="'mercenaries.team-widget.tasks-completed'"></div>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsTasksListComponent {
	@Input() tasks: readonly Task[];
}

export interface Task {
	readonly mercenaryCardId: string;
	readonly mercenaryRole: 'TANK' | 'CASTER' | 'FIGHTER';
	readonly mercenaryName: string;
	readonly title: string;
	readonly header: string;
	readonly description: string;
	readonly taskChainProgress: number;
	readonly progress: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
}
