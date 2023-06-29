import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { StatContext } from '@firestone-hs/build-global-stats/dist/model/context.type';
import { GlobalStatKey } from '@firestone-hs/build-global-stats/dist/model/global-stat-key.type';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { AchievementStatus } from '../../models/achievement/achievement-status.type';
import { CompletionStep, VisualAchievement } from '../../models/visual-achievement';
import { FeatureFlags } from '../../services/feature-flags';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'achievement-view',
	styleUrls: [`../../../css/component/achievements/achievement-view.component.scss`],
	template: `
		<div class="achievement-container {{ achievementStatus$ | async }}" *ngIf="achievement$ | async as achievement">
			<div class="stripe">
				<achievement-image
					[imageId]="achievement.cardId"
					[imageType]="achievement.cardType"
				></achievement-image>
				<div class="achievement-body">
					<div class="text">
						<div class="achievement-name">{{ achievement.name }}</div>
						<div class="achievement-text" [innerHTML]="achievementText$ | async"></div>
					</div>
					<div class="completion-progress">
						<achievement-completion-step
							*ngFor="let completionStep of achievement.completionSteps; trackBy: trackByFn"
							[step]="completionStep"
						>
						</achievement-completion-step>
					</div>
				</div>
			</div>
			<div class="buttons" *ngIf="achievementPins">
				<div
					*ngIf="canPin$ | async"
					class="pin-button"
					[ngClass]="{ pinned: isPinned$ | async }"
					inlineSVG="assets/svg/pinned.svg"
					[helpTooltip]="'app.achievements.pin-achievement-tooltip' | owTranslate"
					confirmationTooltip
					[askConfirmation]="liveTrackingDisabled$ | async"
					[confirmationText]="liveTrackingConfirmation"
					[validButtonText]="cancelPin"
					[cancelButtonText]="enableLiveTracking"
					[switchButtonStyles]="true"
					(onConfirm)="togglePin(achievement.hsAchievementId)"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementViewComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	achievementPins = FeatureFlags.ACHIEVEMENT_PINS;

	achievement$: Observable<VisualAchievement>;
	achievementStatus$: Observable<AchievementStatus>;
	achievementText$: Observable<string>;
	canPin$: Observable<boolean>;
	isPinned$: Observable<boolean>;

	liveTrackingDisabled$: Observable<boolean>;

	liveTrackingConfirmation = this.i18n.translateString('app.achievements.pin-without-tracking-confirmation-text');
	enableLiveTracking = this.i18n.translateString('app.achievements.enable-live-tracking');
	cancelPin = this.i18n.translateString('app.achievements.cancel-pin');

	private achievement$$ = new BehaviorSubject<VisualAchievement>(null);
	private pinnedAchievements$$ = new BehaviorSubject<readonly number[]>([]);

	private placeholderRegex = new RegExp('.*(%%globalStats\\.(.*)\\.(.*)%%).*');

	@Input() set achievement(achievement: VisualAchievement) {
		this.achievement$$.next(achievement);
	}

	@Input() set pinnedAchievements(value: readonly number[]) {
		this.pinnedAchievements$$.next(value ?? []);
	}

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.achievement$ = this.achievement$$.asObservable();
		this.achievementStatus$ = this.achievement$.pipe(
			this.mapData((achievement) => achievement.achievementStatus()),
		);
		this.achievementText$ = combineLatest([
			this.achievement$,
			this.store.listen$(([main, nav, prefs]) => main.getGlobalStats()),
		]).pipe(
			this.mapData(([achievement, [globalStats]]) =>
				this.buildAchievementText(achievement.text, achievement.getFirstMissingStep(), globalStats),
			),
		);
		this.canPin$ = this.achievement$.pipe(this.mapData((achievement) => !achievement.isFullyCompleted()));
		this.isPinned$ = combineLatest([this.achievement$, this.pinnedAchievements$$]).pipe(
			this.mapData(([achievement, pinnedAchievements]) =>
				pinnedAchievements.includes(achievement.hsAchievementId),
			),
		);
		this.liveTrackingDisabled$ = this.store
			.listenPrefs$((prefs) => prefs.showLottery)
			.pipe(this.mapData(([showLottery]) => !showLottery));
	}

	async togglePin(achievementId: number) {
		const prefs = await this.prefs.getPreferences();
		const currentPinned = prefs.pinnedAchievementIds ?? [];
		const newPinned = currentPinned.includes(achievementId)
			? currentPinned.filter((id) => id !== achievementId)
			: [...currentPinned, achievementId];
		await this.prefs.savePreferences({ ...prefs, pinnedAchievementIds: newPinned, showLottery: true });
	}

	trackByFn(index: number, item: CompletionStep) {
		return item.id;
	}

	private buildAchievementText(
		initialText: string,
		firstMissingStep: CompletionStep,
		globalStats: GlobalStats,
	): string {
		const textToConsider = firstMissingStep?.completedText ?? initialText;
		if (!textToConsider) {
			return textToConsider;
		}

		const match = this.placeholderRegex.exec(textToConsider);
		let result = textToConsider;
		if (match) {
			const key: GlobalStatKey = match[2] as GlobalStatKey;
			const context: StatContext = match[3] as StatContext;
			const stat =
				globalStats && globalStats.stats
					? globalStats.stats.find((stat) => stat.statKey === key && stat.statContext === context)
					: null;
			const value = stat ? stat.value : 0;
			result = textToConsider.replace(match[1], '' + value);
		}

		const showProgress: boolean = (firstMissingStep?.progress ?? 0) > 0;
		return showProgress ? `${result} (${firstMissingStep.progress} already done)` : result;
	}
}
