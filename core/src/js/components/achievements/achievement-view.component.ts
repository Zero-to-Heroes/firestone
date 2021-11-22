import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { StatContext } from '@firestone-hs/build-global-stats/dist/model/context.type';
import { GlobalStatKey } from '@firestone-hs/build-global-stats/dist/model/global-stat-key.type';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { AchievementStatus } from '../../models/achievement/achievement-status.type';
import { CompletionStep, VisualAchievement } from '../../models/visual-achievement';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

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
							*ngFor="let completionStep of achievement.completionSteps"
							[step]="completionStep"
						>
						</achievement-completion-step>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	achievement$: Observable<VisualAchievement>;
	achievementStatus$: Observable<AchievementStatus>;
	achievementText$: Observable<string>;

	achievement$$ = new BehaviorSubject<VisualAchievement>(null);

	private placeholderRegex = new RegExp('.*(%%globalStats\\.(.*)\\.(.*)%%).*');

	@Input() set achievement(achievement: VisualAchievement) {
		this.achievement$$.next(achievement);
	}

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.achievement$ = this.achievement$$.asObservable();
		this.achievementStatus$ = this.achievement$.pipe(
			this.mapData((achievement) => achievement.achievementStatus()),
		);
		this.achievementText$ = combineLatest(
			this.achievement$,
			this.store.listen$(([main, nav, prefs]) => main.globalStats),
		).pipe(
			this.mapData(([achievement, [globalStats]]) =>
				this.buildAchievementText(achievement.text, achievement.getFirstMissingStep(), globalStats),
			),
		);
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
