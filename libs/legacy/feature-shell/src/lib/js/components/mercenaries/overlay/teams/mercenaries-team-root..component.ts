import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { MercenariesTeamDefinition, MercenaryDefinition, encodeMercs } from '@firestone-hs/deckstrings';
import { VillageVisitorType } from '@firestone-hs/reference-data';
import { MercenariesReferenceData } from '@firestone-hs/trigger-process-mercenaries-review/dist/process-mercenaries-review';
import { MemoryMercenariesCollectionInfo } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { MercenariesMemoryCacheService } from '@legacy-import/src/lib/js/services/mercenaries/mercenaries-memory-cache.service';
import { MercenariesReferenceDataService } from '@legacy-import/src/lib/js/services/mercenaries/mercenaries-reference-data.service';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { getShortMercHeroName, isMercenariesPvP } from '../../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'mercenaries-team-root',
	styleUrls: [
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
							<div
								class="element map-turn"
								[helpTooltip]="mapTurnsTooltip$ | async"
								*ngIf="showMapTurnCounter$ | async"
							>
								<div class="icon" inlineSVG="assets/svg/map.svg"></div>
								<div class="value ">
									{{ totalMapTurns$ | async }}
								</div>
							</div>
						</div>
						<mercenaries-team-list
							[team]="_team"
							[tooltipPosition]="tooltipPosition"
							[enableHighlight]="side !== 'opponent'"
						>
						</mercenaries-team-list>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamRootComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	@Input() side: 'player' | 'opponent' | 'out-of-combat-player';
	@Input() scaleExtractor: (prefs: Preferences) => number;

	@Input() set team(value: MercenariesBattleTeam) {
		this._team = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() tooltipPosition: CardTooltipPositionType = 'left';

	@Input() set showTurnCounter(value: boolean) {
		this.showTurnCounter$$.next(value);
	}

	showTurnCounter$: Observable<boolean>;
	showMapTurnCounter$: Observable<boolean>;
	currentBattleTurn$: Observable<number>;
	totalMapTurns$: Observable<string>;
	mapTurnsTooltip$: Observable<string>;

	_team: MercenariesBattleTeam;

	overlayWidthInPx = 225;

	private scale: Subscription;
	private showTurnCounter$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
		private readonly mercenariesMemoryCache: MercenariesMemoryCacheService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mercenariesMemoryCache, this.prefs);

		this.scale = this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => (!!this.scaleExtractor ? this.scaleExtractor(prefs) : null)),
				debounceTime(100),
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
		this.showTurnCounter$ = this.showTurnCounter$$.asObservable().pipe(this.mapData((info) => info));
		this.showMapTurnCounter$ = this.store
			.listenMercenaries$(([state]) => state?.gameMode)
			.pipe(this.mapData(([gameMode]) => !isMercenariesPvP(gameMode)));
		this.currentBattleTurn$ = this.store
			.listenMercenaries$(([state, prefs]) => state?.currentTurn)
			.pipe(this.mapData(([currentTurn]) => currentTurn));
		this.totalMapTurns$ = combineLatest([
			this.currentBattleTurn$,
			this.mercenariesMemoryCache.memoryMapInfo$$,
		]).pipe(
			this.mapData(([currentBattleTurn, mapInfo]) =>
				mapInfo?.Map?.TurnsTaken == null
					? '?'
					: '' + ((mapInfo?.Map?.TurnsTaken ?? 0) + (currentBattleTurn ?? 0)),
			),
		);
		this.mapTurnsTooltip$ = this.totalMapTurns$.pipe(
			this.mapData((turns) =>
				turns === '?'
					? this.i18n.translateString('mercenaries.team-widget.turn-counter.total-map-turns-error-tooltip')
					: this.i18n.translateString('mercenaries.team-widget.turn-counter.total-map-turns-tooltip'),
			),
		);

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByTaskFn(index: number, task: Task) {
		return task.description;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.scale?.unsubscribe();
	}
}

@Component({
	selector: 'mercs-tasks-list',
	styleUrls: [
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-root.component.scss',
		'../../../../../css/component/mercenaries/overlay/teams/tasks-list.scss',
	],
	template: `
		<div class="tasks-container" *ngIf="{ tasks: tasks$ | async } as value">
			<ng-container *ngIf="value.tasks?.length; else emptyState">
				<div class="task" *ngFor="let task of value.tasks; trackBy: trackByTaskFn">
					<div class="portrait" *ngIf="task.mercenaryCardId" [cardTooltip]="task.mercenaryCardId">
						<img class="art" [src]="task.portraitUrl" />
						<img class="frame" *ngIf="task.frameUrl" [src]="task.frameUrl" />
					</div>
					<div class="task-content">
						<div class="header">{{ task.header }}</div>
						<div class="description" [innerHTML]="task.description"></div>
						<div class="progress">
							<div class="background"></div>
							<div class="current-progress" [style.width.%]="task.progressPercentage"></div>
							<div class="text">{{ task.progress }} / {{ task.quota }}</div>
						</div>
					</div>
				</div>
				<div class="create-team-button" *ngIf="taskTeamDeckstrings?.length">
					<button
						*ngFor="let info of taskTeamDeckstrings; let i = index"
						[helpTooltip]="info.tooltip"
						(click)="createTeamFromTasks(info)"
						[ngClass]="{ disabled: isCopied }"
					>
						{{ buttonLabel || info.label }}
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
export class MercsTasksListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Output() tasksListUpdated = new EventEmitter<void>();

	tasks$: Observable<readonly Task[]>;

	@Input() set tasks(value: readonly Task[]) {
		this.tasks$$.next(value);
	}

	taskTeamDeckstrings: readonly TeamDeckstringInfo[];

	isCopied: boolean;
	buttonLabel: string;

	private tasks$$ = new BehaviorSubject<readonly Task[]>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesCollection: MercenariesMemoryCacheService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.mercenariesCollection.isReady();
		await this.mercenariesReferenceData.isReady();

		this.tasks$ = this.tasks$$.asObservable().pipe(this.mapData((info) => info));
		this.tasks$.pipe(this.mapData((info) => info)).subscribe((info) => this.tasksListUpdated.next());
		combineLatest([
			this.mercenariesReferenceData.referenceData$$,
			this.mercenariesCollection.memoryCollectionInfo$$,
			this.store.listenPrefs$((prefs) => prefs.mercenariesBackupTeam),
			this.tasks$,
		])
			.pipe(
				this.mapData(([refData, collectionInfo, [mercBackupIds], tasks]) =>
					buildTeamsForTasks(tasks, refData as any, collectionInfo, mercBackupIds, this.allCards, this.i18n),
				),
			)
			.subscribe((infos) => {
				this.taskTeamDeckstrings = infos;
				this.tasksListUpdated.next();
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		// Because we await
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	createTeamFromTasks(info: TeamDeckstringInfo) {
		if (this.isCopied) {
			return;
		}

		this.isCopied = true;
		this.ow.placeOnClipboard(info.deckstring);
		this.buttonLabel = this.i18n.translateString('mercenaries.team-widget.create-team-button-ok-label');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.buttonLabel = null;
			this.isCopied = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 3000);
	}

	trackByTaskFn(index: number, item: Task) {
		return item.title;
	}
}

export interface Task {
	readonly ownerMercenaryDbfId: number;
	readonly mercenaryCardId: string;
	readonly mercenaryRole: 'TANK' | 'CASTER' | 'FIGHTER';
	readonly mercenaryName: string;
	readonly title: string;
	readonly header: string;
	readonly description: string;
	readonly taskChainProgress: number;
	readonly quota: number;
	readonly progress: number;
	readonly progressPercentage: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
	readonly type: VillageVisitorType;
	readonly additionalMercDbfIds: readonly number[];
}

const buildTeamsForTasks = (
	tasks: readonly Task[],
	mercReferenceData: MercenariesReferenceData,
	mercCollectionInfo: MemoryMercenariesCollectionInfo,
	backupMercIds: readonly number[],
	allCards: CardsFacadeService,
	i18n: LocalizationFacadeService,
): readonly TeamDeckstringInfo[] => {
	if (!mercReferenceData?.mercenaries?.length || !tasks?.length) {
		console.warn('missing reference data');
		return null;
	}

	const proceduralTasks = tasks.filter((task) => task.type === VillageVisitorType.PROCEDURAL);
	return proceduralTasks.map((proceduralTask) => {
		const taskMercs = [proceduralTask.ownerMercenaryDbfId, ...(proceduralTask.additionalMercDbfIds ?? [])]
			.map((mercDbfId) =>
				buildMerc(
					mercReferenceData.mercenaries.find((merc) => merc.cardDbfId === mercDbfId),
					mercCollectionInfo,
				),
			)
			.filter((m) => !!m);
		const backupMercs = [...new Array(Math.max(0, 6 - (taskMercs?.length ?? 0))).keys()]
			.map((_, i) => backupMercIds[i])
			.filter((id) => !!id)
			.map((backupId) =>
				buildMerc(
					mercReferenceData.mercenaries.find((merc) => merc.id === backupId),
					mercCollectionInfo,
				),
			)
			.filter((m) => !!m);
		const finalMercs = [...backupMercs, ...taskMercs];

		const ownerName = getShortMercHeroName(allCards.getCard(proceduralTask.ownerMercenaryDbfId).id, allCards);
		const definition: MercenariesTeamDefinition = {
			teamId: 1,
			type: 1,
			name: i18n.translateString('mercenaries.team-widget.task-team-default-name', { mercName: ownerName }),
			mercenaries: finalMercs,
		};
		if (!definition?.mercenaries?.length) {
			return null;
		}

		const deckstring = encodeMercs(definition);
		return {
			deckstring: deckstring,
			label: i18n.translateString('mercenaries.team-widget.create-team-button-label', {
				mercName: ownerName,
			}),
			tooltip: i18n.translateString('mercenaries.team-widget.create-team-button-tooltip', {
				mercName: ownerName,
			}),
		};
	});
};

export const buildMerc = (
	refMerc: MercenariesReferenceData['mercenaries'][0],
	mercCollectionInfo: MemoryMercenariesCollectionInfo,
): MercenaryDefinition => {
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
	const artVariationPremium = memMerc?.Loadout?.ArtVariationPremium ?? memMerc.Skins.find((s) => s.Default)?.Id ?? 0;
	const result: MercenaryDefinition = {
		mercenaryId: refMerc.id,
		selectedArtVariationId: artVariationId,
		selectedArtVariationPremium: artVariationPremium,
		selectedEquipmentId: equipmentId,
		sharedTeamMercenaryIsFullyUpgraded: 0,
		sharedTeamMercenaryXp: 0,
	};
	return result;
};

interface TeamDeckstringInfo {
	readonly deckstring: string;
	readonly label: string;
	readonly tooltip: string;
}
