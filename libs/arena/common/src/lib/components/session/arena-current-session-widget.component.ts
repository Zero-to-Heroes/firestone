/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter } from 'rxjs';
import { ArenaRunsService } from '../../services/arena-runs.service';

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
						[fsTranslate]="'session.title'"
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
					<div class="games">{{ totalGamesLabel$ | async }}</div>
					<div class="average">
						<div class="current">{{ currentAverage$ | async }}</div>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCurrentSessionWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	opacity$: Observable<number>;
	totalGamesLabel$: Observable<string>;
	currentAverage$: Observable<string>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly runs: ArenaRunsService,
		private readonly patches: PatchesConfigService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.runs, this.patches);

		this.opacity$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => Math.max(0.01, prefs.arenaSessionWidgetOpacity / 100)),
		);

		const seasonStart$ = this.patches.currentArenaSeasonPatch$$.pipe(
			this.mapData((patch) => patch?.date),
			filter((patch) => !!patch),
			distinctUntilChanged(),
		);
		const lastRuns$ = combineLatest([
			this.runs.allRuns$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaCurrentSessionStartDate)),
			seasonStart$,
		]).pipe(
			this.mapData(([runs, sessionStartDate, seasonStart]) =>
				runs?.filter((run) => run.creationTimestamp >= new Date(seasonStart!).getTime()),
			),
		);
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
				return average;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	close() {
		this.prefs.updatePrefs('arenaShowCurrentSessionWidget', false);
	}
}
