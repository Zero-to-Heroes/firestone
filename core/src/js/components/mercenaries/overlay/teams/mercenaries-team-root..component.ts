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
import { encodeMercs, MercenariesTeamDefinition, MercenaryDefinition } from '@firestone-hs/deckstrings';
import { VillageVisitorType } from '@firestone-hs/reference-data';
import { MercenariesReferenceData } from '@firestone-hs/trigger-process-mercenaries-review/dist/process-mercenaries-review';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { MemoryMercenariesCollectionInfo } from '../../../../models/memory/memory-mercenaries-collection-info';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { isMercenariesPvP } from '../../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
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
						<div class="header" *ngIf="showTurnCounter$ | async">
							<div class="label" [owTranslate]="'mercenaries.team-widget.turn-counter.turns'"></div>
							<div
								class="element battle-turn"
								[helpTooltip]="
									'mercenaries.team-widget.turn-counter.current-battle-turn-tooltip' | owTranslate
								"
							>
								<svg class="icon svg-icon-fill">
									<use xlink:href="assets/svg/sprite.svg#sword" />
								</svg>
								<div class="value ">
									{{ currentBattleTurn$ | async }}
								</div>
							</div>
							<div class="element map-turn" [helpTooltip]="mapTurnsTooltip$ | async">
								<div class="icon" inlineSVG="assets/svg/map.svg"></div>
								<div class="value ">
									{{ totalMapTurns$ | async }}
								</div>
							</div>
						</div>
						<mercenaries-team-list [team]="_team" [tooltipPosition]="tooltipPosition">
						</mercenaries-team-list>
						<div class="footer">
							<div
								class="mouseover-button show-tasks"
								[ngClass]="{ 'visible': showTasks$ | async }"
								(mouseenter)="showTasks()"
								(mouseleave)="hideTasks()"
							>
								<div class="tasks-button">
									<div class="icon" inlineSVG="assets/svg/created_by.svg"></div>
									{{ 'mercenaries.team-widget.tasks-button' | owTranslate }}
								</div>
								<mercs-tasks-list
									class="task-list {{ tooltipPosition }}"
									[ngClass]="{ 'visible': showTaskList$ | async }"
									[style.bottom]="taskListBottom"
									[style.top]="taskListTop"
									[tasks]="_tasks"
									[taskTeamDeckstring]="taskTeamDeckstring$ | async"
								></mercs-tasks-list>
							</div>

							<div
								class="mouseover-button show-roles-matchup-button"
								[ngClass]="{ 'visible': showColorChart$ | async }"
								(mouseenter)="showRolesChart()"
								(mouseleave)="hideRolesChart()"
							>
								<div class="roles-matchup-button">
									<div class="icon" inlineSVG="assets/svg/created_by.svg"></div>
									{{ 'mercenaries.team-widget.roles-chart-button' | owTranslate }}
								</div>
								<div
									class="roles-chart {{ tooltipPosition }}"
									[ngClass]="{ 'visible': showRolesChart$ | async }"
									[style.bottom]="taskListBottom"
									[style.top]="taskListTop"
								>
									<img class="chart" src="assets/images/mercenaries-weakness-triangle.png" />
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
		this.updateTaskListBottom();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set tasks(value: readonly Task[]) {
		if (!value) {
			return;
		}
		this._tasks = value;
		this.tasks$$.next(value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	@Input() set showTurnCounter(value: boolean) {
		this.showTurnCounter$$.next(value);
	}

	showColorChart$: Observable<boolean>;
	showTasks$: Observable<boolean>;
	showTaskList$: Observable<boolean>;
	showRolesChart$: Observable<boolean>;
	showTurnCounter$: Observable<boolean>;
	currentBattleTurn$: Observable<number>;
	totalMapTurns$: Observable<string>;
	mapTurnsTooltip$: Observable<string>;
	taskTeamDeckstring$: Observable<string>;

	_team: MercenariesBattleTeam;
	_tasks: readonly Task[];

	overlayWidthInPx = 225;
	taskListBottom = 'auto';
	taskListTop = 'auto';

	private scale: Subscription;
	private showTaskList$$ = new BehaviorSubject<boolean>(false);
	private showRolesChart$$ = new BehaviorSubject<boolean>(false);
	private showTurnCounter$$ = new BehaviorSubject<boolean>(false);
	private tasks$$ = new BehaviorSubject<readonly Task[]>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.taskTeamDeckstring$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.mercenaries.getReferenceData(),
				([main, nav]) => main.mercenaries.collectionInfo,
			),
			this.store.listenPrefs$((prefs) => prefs.mercenariesBackupTeam),
			this.tasks$$.asObservable(),
		).pipe(
			this.mapData(([[refData, collectionInfo], [mercBackupIds], tasks]) =>
				this.buildTeamForTasks(tasks, refData, collectionInfo, mercBackupIds),
			),
		);
		this.taskTeamDeckstring$.pipe(this.mapData((info) => info)).subscribe((info) => this.updateTaskListBottom());
		this.showColorChart$ = this.store
			.listenPrefs$((prefs) => prefs.mercenariesShowColorChartButton)
			.pipe(this.mapData(([pref]) => pref));
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
			this.mapData(([[gameMode], [pref]]) => pref && !isMercenariesPvP(gameMode)),
		);
		this.showTaskList$ = this.showTaskList$$.asObservable().pipe(this.mapData((info) => info));
		this.showRolesChart$ = this.showRolesChart$$.asObservable().pipe(this.mapData((info) => info));
		this.showTurnCounter$ = this.showTurnCounter$$.asObservable().pipe(this.mapData((info) => info));
		this.currentBattleTurn$ = this.store
			.listenMercenaries$(([state, prefs]) => state?.currentTurn)
			.pipe(
				// One turn is logged between each phase (order selection and combat)
				this.mapData(([currentTurn]) => Math.ceil((isNaN(+currentTurn) ? 0 : +currentTurn) / 2)),
			);
		this.totalMapTurns$ = combineLatest(
			this.currentBattleTurn$,
			this.store.listen$(([main, nav]) => main.mercenaries.mapInfo?.Map?.TurnsTaken),
		).pipe(
			this.mapData(([currentBattleTurn, [totalMapTurns]]) =>
				totalMapTurns == null ? '?' : '' + ((totalMapTurns ?? 0) + (currentBattleTurn ?? 0)),
			),
		);
		this.mapTurnsTooltip$ = this.totalMapTurns$.pipe(
			this.mapData((turns) =>
				turns === '?'
					? this.i18n.translateString('mercenaries.team-widget.turn-counter.total-map-turns-error-tooltip')
					: this.i18n.translateString('mercenaries.team-widget.turn-counter.total-map-turns-tooltip'),
			),
		);
	}

	trackByTaskFn(index: number, task: Task) {
		return task.description;
	}

	private updateTaskListBottom() {
		setTimeout(() => {
			const taskListEl = this.el.nativeElement.querySelector('.task-list');
			if (!taskListEl) {
				return;
			}

			const taskEls = this.el.nativeElement.querySelectorAll('.task');
			if (taskEls?.length != this._tasks?.length) {
				setTimeout(() => this.updateTaskListBottom(), 100);
				return;
			}

			const rect = taskListEl.getBoundingClientRect();
			const taskListHeight = rect.height;
			const widgetEl = this.el.nativeElement.querySelector('.team-container');
			const widgetRect = widgetEl.getBoundingClientRect();
			const widgetHeight = widgetRect.height;
			// We either align the bottom of the list with the bottom of the button (when the widget is
			// bigger than the list), or the top of the list with the top of the widget
			if (widgetHeight > taskListHeight) {
				this.taskListBottom = '0';
				this.taskListTop = 'auto';
			} else {
				this.taskListBottom = 'auto';
				this.taskListTop = '0';
			}
			console.debug(
				'setting margin',
				this.taskListBottom,
				this.taskListTop,
				widgetHeight,
				taskListHeight,
				widgetRect,
				rect,
				taskListEl,
			);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 500);
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

	showRolesChart() {
		this.showRolesChart$$.next(true);
	}

	hideRolesChart() {
		this.showRolesChart$$.next(false);
	}

	private buildTeamForTasks(
		tasks: readonly Task[],
		mercReferenceData: MercenariesReferenceData,
		mercCollectionInfo: MemoryMercenariesCollectionInfo,
		backupMercIds: readonly number[],
	): string {
		console.debug('building team for tasks', tasks, mercReferenceData);
		if (!mercReferenceData?.mercenaries?.length || !tasks?.length) {
			console.warn('missing reference data');
			return null;
		}

		const taskMercs = tasks
			.filter((task) => task.type === VillageVisitorType.STANDARD)
			.map((task) => this.allCards.getCard(task.mercenaryCardId)?.dbfId)
			.map((mercDbfId) =>
				this.buildMerc(
					mercReferenceData.mercenaries.find((merc) => merc.cardDbfId === mercDbfId),
					mercCollectionInfo,
				),
			)
			.filter((m) => !!m);
		const backupMercs = [...new Array(6 - (taskMercs?.length ?? 0)).keys()]
			.map((_, i) => backupMercIds[i])
			.filter((id) => !!id)
			.map((backupId) =>
				this.buildMerc(
					mercReferenceData.mercenaries.find((merc) => merc.id === backupId),
					mercCollectionInfo,
				),
			)
			.filter((m) => !!m);
		const finalMercs = [...taskMercs, ...backupMercs];
		console.debug('final mercs', finalMercs, taskMercs, backupMercs, backupMercIds);

		const definition: MercenariesTeamDefinition = {
			teamId: 1,
			type: 1,
			name: this.i18n.translateString('mercenaries.team-widget.task-team-default-name'),
			mercenaries: finalMercs,
		};
		if (!definition?.mercenaries?.length) {
			return null;
		}

		const deckstring = encodeMercs(definition);
		console.log('mercs definition', deckstring, definition);
		return deckstring;
	}

	private buildMerc(
		refMerc: MercenariesReferenceData['mercenaries'][0],
		mercCollectionInfo: MemoryMercenariesCollectionInfo,
	): MercenaryDefinition {
		if (!refMerc) {
			return null;
		}

		const memMerc = mercCollectionInfo?.Mercenaries?.find((m) => m.Id === refMerc.id);
		const equipmentId =
			memMerc?.Loadout?.Equipment?.Id ??
			(memMerc?.Equipments ?? []).find((e) => e.Equipped)?.Id ??
			[...(memMerc?.Equipments ?? [])].sort((a, b) => b.Tier - a.Tier)[0]?.Id ??
			refMerc.equipments[0]?.equipmentId;
		const artVariationId = memMerc?.Loadout?.ArtVariation?.Id ?? memMerc.Skins.find((s) => s.Default)?.Id ?? 0;
		const artVariationPremium =
			memMerc?.Loadout?.ArtVariationPremium ?? memMerc.Skins.find((s) => s.Default)?.Id ?? 0;
		const result: MercenaryDefinition = {
			mercenaryId: refMerc.id,
			selectedArtVariationId: artVariationId,
			selectedArtVariationPremium: artVariationPremium,
			selectedEquipmentId: equipmentId,
			sharedTeamMercenaryIsFullyUpgraded: 0,
			sharedTeamMercenaryXp: 0,
		};
		console.log('merc for tasks', result);
		return result;
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
				<div class="create-team-button" *ngIf="taskTeamDeckstring">
					<button
						[helpTooltip]="buttonTooltip"
						(click)="createTeamFromTasks()"
						[ngClass]="{ 'disabled': isCopied }"
					>
						{{ buttonLabel }}
					</button>
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
	@Input() taskTeamDeckstring: string;

	isCopied: boolean;
	buttonLabel = this.i18n.translateString('mercenaries.team-widget.create-team-button-label');
	buttonTooltip = this.i18n.translateString('mercenaries.team-widget.create-team-button-tooltip');

	constructor(
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	createTeamFromTasks() {
		if (this.isCopied) {
			return;
		}

		this.isCopied = true;
		this.ow.placeOnClipboard(this.taskTeamDeckstring);
		this.buttonLabel = this.i18n.translateString('mercenaries.team-widget.create-team-button-ok-label');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.buttonLabel = this.i18n.translateString('mercenaries.team-widget.create-team-button-label');
			this.isCopied = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 3000);
	}
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
	readonly type: VillageVisitorType;
}
