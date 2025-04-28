/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { AccountService } from '@firestone/profile/common';
import {
	ArenaSessionWidgetTimeFrame,
	PatchesConfigService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, filter, shareReplay, takeUntil } from 'rxjs';
import { ArenaRun } from '../../models/arena-run';
import { ArenaRunsService } from '../../services/arena-runs.service';
import { ArenaCurrentSessionTooltipComponent } from './arena-current-session-tooltip.component';

@Component({
	selector: 'arena-current-session-widget',
	styleUrls: ['./arena-current-session-widget.component.scss'],
	template: `
		<div class="current-session-widget">
			<ng-container *ngIf="{ opacity: opacity$ | async } as value">
				<div class="background" [style.opacity]="value.opacity"></div>
				<div class="controls">
					<div
						class="title"
						[fsTranslate]="'session.arena-title'"
						[helpTooltip]="'session.arena-title-tooltip' | fsTranslate"
					></div>
					<div class="buttons">
						<div
							class="button close"
							[helpTooltip]="'session.buttons.close-tooltip' | fsTranslate"
							inlineSVG="assets/svg/close.svg"
							(click)="close()"
						></div>
					</div>
				</div>
				<div class="summary">
					<div class="games data">
						<div class="value">{{ totalGames$ | async }}</div>
						<div class="text">
							<div class="runs-text" [fsTranslate]="'session.summary.runs-text'"></div>
							<div
								class="time-frame"
								(click)="cycleTimeFrame()"
								[helpTooltip]="'session.time-frame.tooltip' | fsTranslate"
							>
								{{ timeFrameLabel$ | async }}
							</div>
						</div>
					</div>
					<div class="average data">
						<div class="value" [helpTooltip]="'session.summary.average-tooltip' | fsTranslate">
							{{ currentAverage$ | async }}
						</div>
						<div class="text" [fsTranslate]="'session.summary.average-text'"></div>
					</div>
				</div>
				<div class="content">
					<div class="grouped" *ngIf="showGroups$ | async">
						<div class="group" *ngFor="let group of groups$ | async; trackBy: trackByGroupFn">
							<img class="icon" [src]="group.winRangeIcon" />
							<div class="category">{{ group.winRangeLabel }}</div>
							<div class="value">{{ group.value }}</div>
							<div class="group-details">
								<div
									class="group-detail"
									*ngFor="let detail of group.details"
									componentTooltip
									[componentTooltipAllowMouseOver]="true"
									[componentType]="componentType"
									[componentInput]="detail"
									componentTooltipPosition="right"
								>
									<img class="portrait" [src]="detail.cardId" />
								</div>
							</div>
						</div>
					</div>
					<ng-container *ngIf="{ showMatches: showMatches$ | async, runs: runs$ | async } as value">
						<div class="details" *ngIf="value.showMatches && value.runs?.length">
							<div class="detail" *ngFor="let run of value.runs">
								<arena-run class="run" [run]="run"></arena-run>
								<div
									class="view-deck-icon"
									inlineSVG="assets/svg/show.svg"
									componentTooltip
									[componentTooltipAllowMouseOver]="true"
									[componentType]="componentType"
									[componentInput]="run.detail"
									componentTooltipPosition="right"
								></div>
							</div>
						</div>
					</ng-container>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCurrentSessionWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	componentType: ComponentType<ArenaCurrentSessionTooltipComponent> = ArenaCurrentSessionTooltipComponent;

	opacity$: Observable<number>;
	timeFrameLabel$: Observable<string>;
	totalGames$: Observable<number>;
	totalGamesLabel$: Observable<string>;
	currentAverage$: Observable<string>;
	showGroups$: Observable<boolean>;
	groups$: Observable<readonly Group[]>;
	showMatches$: Observable<boolean>;
	runs$: Observable<readonly ExtendedArenaRun[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly runs: ArenaRunsService,
		private readonly patches: PatchesConfigService,
		private readonly region: AccountService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.runs, this.patches, this.region, this.gameState);

		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => Math.max(0.01, prefs.arenaSessionWidgetOpacity / 100)),
		);
		const inGame$ = this.gameState.gameState$$.pipe(
			debounceTime(1000),
			this.mapData((state) => state?.gameStarted && !state?.gameEnded),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showGroups$ = combineLatest([inGame$, this.prefs.preferences$$]).pipe(
			this.mapData(
				([inGame, prefs]) =>
					prefs.arenaSessionWidgetShowGroup && (!inGame || prefs.arenaSessionWidgetShowGroupInGame),
			),
		);
		this.showMatches$ = combineLatest([inGame$, this.prefs.preferences$$]).pipe(
			this.mapData(
				([inGame, prefs]) =>
					prefs.arenaSessionWidgetShowMatches && (!inGame || prefs.arenaSessionWidgetShowMatchesInGame),
			),
		);

		const timeFrame$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaCurrentSessionTimeFrame),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.timeFrameLabel$ = timeFrame$.pipe(
			this.mapData((timeFrame) => {
				const timeFrameText = this.i18n.translateString(`session.time-frame.${timeFrame}`);
				return timeFrameText;
			}),
		);
		const seasonStart$ = this.patches.currentArenaSeasonPatch$$.pipe(
			this.mapData((patch) => patch?.date),
			filter((patch) => !!patch),
			distinctUntilChanged(),
		);

		const lastRuns$ = combineLatest([
			this.runs.allRuns$$.pipe(
				this.mapData((runs) => runs),
				distinctUntilChanged(
					(a, b) => (a?.length ?? 0) === (b?.length ?? 0) && a?.[0]?.steps?.length === b?.[0]?.steps?.length,
				),
			),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaCurrentSessionStartDate)),
			this.region.region$$.pipe(this.mapData((region) => region)),
			timeFrame$,
			seasonStart$,
		]).pipe(
			this.mapData(([runs, sessionStartDate, region, timeFrame, seasonStart]) =>
				runs
					?.filter((r) => !!r?.getFirstMatch())
					.filter((run) => isCorrectRegion(run, region))
					.filter((run) => isCorrectTime(run, timeFrame, new Date(seasonStart!))),
			),
		);
		this.totalGames$ = lastRuns$.pipe(this.mapData((games) => games?.length ?? 0));
		this.totalGamesLabel$ = lastRuns$.pipe(
			this.mapData((games) => {
				return this.i18n.translateString('session.summary.total-runs', { value: games?.length ?? 0 });
			}),
		);
		this.currentAverage$ = lastRuns$.pipe(
			this.mapData((runs) => {
				const totalWins = runs?.reduce((acc, run) => acc + (run.wins ?? 0), 0) ?? 0;
				const totalRuns = runs?.length ?? 0;
				const average = totalRuns > 0 ? (totalWins / totalRuns).toFixed(2) : '-';
				return average; //this.i18n.translateString('session.summary.average', { value: average });
			}),
		);
		this.groups$ = lastRuns$.pipe(
			this.mapData((runs) => {
				const groupKeys: readonly WinRange[] = allWinRanges;
				const groups = groupKeys.map((key) => {
					const runsInGroup =
						runs
							?.filter((run) => isRunInGroup(run, key))
							.sort((a, b) => b.creationTimestamp - a.creationTimestamp)
							.slice(0, 10) ?? [];
					const groupDetails: readonly GroupDetail[] = runsInGroup.map((run) => ({
						cardId: `https://static.firestoneapp.com/cards/heroSkins/enUS/256/${run.heroCardId}.png`,
						deckstring: run.initialDeckList,
						wins: run.wins,
						losses: run.losses,
						deckScore: run.draftStat?.deckScore,
						date: new Date(run.creationTimestamp),
					}));
					const winRangeLabel = key;
					const startOfWinRange = key.split('-')[0];
					const icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/arena/arena${startOfWinRange}wins.png`;
					return {
						winRange: key,
						winRangeLabel,
						winRangeIcon: icon,
						value: runsInGroup.length,
						details: groupDetails,
					};
				});
				return groups;
			}),
		);

		this.runs$ = combineLatest([
			lastRuns$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaSessionWidgetNumberOfMatchesToShow)),
		]).pipe(
			this.mapData(
				([runs, sessionWidgetNumberOfMatchesToShow]) =>
					(runs?.slice(0, sessionWidgetNumberOfMatchesToShow) ?? []).map((run) => {
						const detail: GroupDetail = {
							cardId: `https://static.firestoneapp.com/cards/heroSkins/enUS/256/${run.heroCardId}.png`,
							deckstring: run.initialDeckList,
							wins: run.wins,
							losses: run.losses,
							deckScore: run.draftStat?.deckScore,
							date: new Date(run.creationTimestamp),
						};
						const result: ExtendedArenaRun = ExtendedArenaRun.create({
							...run,
							detail: detail,
						});
						return result;
					}) ?? [],
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async cycleTimeFrame() {
		const allTimeFrames = ['current-season', 'all-time'] as ArenaSessionWidgetTimeFrame[];
		const prefs = await this.prefs.getPreferences();
		const currentTimeFrame = prefs.arenaCurrentSessionTimeFrame;
		const currentTimeFrameIndex = allTimeFrames.findIndex((timeFrame) => timeFrame === currentTimeFrame);
		const nextTimeFrameIndex = (currentTimeFrameIndex + 1) % allTimeFrames.length;
		const nextTimeFrame = allTimeFrames[nextTimeFrameIndex];
		this.prefs.updatePrefs('arenaCurrentSessionTimeFrame', nextTimeFrame);
	}

	close() {
		this.prefs.updatePrefs('arenaShowCurrentSessionWidget', false);
	}

	trackByGroupFn(index: number, group: Group): string {
		return group.winRange;
	}
}

const isCorrectRegion = (run: ArenaRun, region: BnetRegion | null): boolean => {
	return !region || run?.getFirstMatch()?.region === region;
};

const isRunInGroup = (run: ArenaRun, group: WinRange): boolean => {
	if (group.includes('-')) {
		const [min, max] = group.split('-').map((s) => parseInt(s, 10));
		return run.wins >= min && run.wins <= max;
	} else {
		return run.wins === parseInt(group, 10);
	}
};

const isCorrectTime = (run: ArenaRun, timeFrame: ArenaSessionWidgetTimeFrame, seasonStart: Date): boolean => {
	switch (timeFrame) {
		case 'current-season':
			return run.creationTimestamp >= seasonStart.getTime();
		case 'all-time':
		default:
			return true;
	}
};

interface Group {
	readonly winRange: WinRange;
	readonly winRangeIcon: string;
	readonly winRangeLabel: string;
	readonly value: number;
	readonly details: readonly GroupDetail[];
}

export interface GroupDetail {
	readonly cardId: string;
	readonly deckstring: string;
	readonly wins: number;
	readonly losses: number;
	readonly deckScore: number;
	readonly date: Date;
}

class ExtendedArenaRun extends ArenaRun {
	readonly detail: GroupDetail;

	public static override create(data: Partial<ArenaRun> & { detail: GroupDetail }): ExtendedArenaRun {
		return Object.assign(new ExtendedArenaRun(), data);
	}
}

export type WinRange = '12' | '11' | '10' | '9' | '6-8' | '3-5' | '0-2';
export const allWinRanges: readonly WinRange[] = ['12', '11', '10', '9', '6-8', '3-5', '0-2'];
