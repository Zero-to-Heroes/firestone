import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { QuestStatus, RewardTrackType } from '@firestone-hs/reference-data';
import { Preferences } from '@firestone/shared/common/service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';

@Component({
	selector: 'quests-widget-view',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/quests/quests-widget-view.component.scss',
	],
	template: `
		<div class="quests-widget {{ theme }}">
			<div
				class="widget-icon"
				*ngIf="showQuests$ | async"
				(mouseenter)="onMouseEnter()"
				(mouseleave)="onMouseLeave()"
				(click)="onMouseLeave()"
				(mousedown)="onMouseLeave()"
				(mouseup)="onMouseLeave()"
			>
				<img [src]="widgetIcon" />
			</div>
			<hs-quests-list
				class="quests-container"
				[ngClass]="{
					visible: showQuestsDetails$ | async,
					right: showRight$ | async,
					bottom: showBottom$ | async
				}"
				[quests]="quests$ | async"
				[theme]="theme"
			>
			</hs-quests-list>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestsWidgetViewComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() theme: string;
	@Input() widgetIcon: string;
	@Input() xpIcon: string;

	@Input() rewardsTrackMatcher: (type: RewardTrackType) => boolean;
	@Input() showPrefsExtractor: (prefs: Preferences) => boolean;
	@Input() xpBonusExtractor: (state: MainWindowState, type: RewardTrackType) => number;

	quests$: Observable<readonly Quest[]>;
	showQuests$: Observable<boolean>;
	showXpBar$: Observable<boolean>;
	showQuestsDetails$: Observable<boolean>;
	showRight$: Observable<boolean>;
	showBottom$: Observable<boolean>;

	private showWidget$$ = new BehaviorSubject<boolean>(false);
	private showRight$$ = new BehaviorSubject<boolean>(false);
	private showBottom$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.quests$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.quests.getReferenceQuests(),
				([main, nav]) => main.quests.activeQuests,
				([main, nav]) => main,
			),
		).pipe(
			this.mapData(([[referenceQuests, activeQuests, state]]) => {
				return activeQuests?.Quests?.filter((q) => [QuestStatus.NEW, QuestStatus.ACTIVE].includes(q.Status))
					.map((quest) => {
						const refQuest = referenceQuests?.quests?.find((q) => q.id === quest.Id);
						if (!refQuest) {
							console.warn('missing ref quest', quest.Id, referenceQuests?.quests?.length, quest);
							return null;
						}
						if (!this.rewardsTrackMatcher(refQuest.rewardTrackType)) {
							return null;
						}

						const xpBonus = this.xpBonusExtractor
							? this.xpBonusExtractor(state, refQuest.rewardTrackType)
							: 0;
						const result: Quest = {
							name: refQuest?.name ?? 'Unknown quest',
							description:
								refQuest?.description?.replaceAll('$q', '' + refQuest?.quota) ?? 'Unknown description',
							quota: refQuest?.quota,
							progress: quest.Progress ?? 0,
							progressPercentage: !!refQuest?.quota ? (100 * (quest.Progress ?? 0)) / refQuest.quota : 0,
							xp: Math.round(refQuest?.rewardTrackXp * (1 + (xpBonus ?? 0) / 100)),
							xpBonus: xpBonus,
							xpIcon: this.getQuestIcon(refQuest.rewardTrackType, !!xpBonus),
						};
						return result;
					})
					.filter((q) => !!q);
			}),
		);
		this.showQuests$ = combineLatest(
			this.store.listenPrefs$(
				(prefs) => prefs,
				(prefs) => prefs.showQuestsWidgetWhenEmpty,
			),
			this.quests$,
		).pipe(
			this.mapData(([[prefs, showWhenEmpty], quests]) => {
				const showQuests = this.showPrefsExtractor && this.showPrefsExtractor(prefs);
				return showQuests && (!!quests?.length || showWhenEmpty);
			}),
		);
		this.showQuestsDetails$ = this.showWidget$$.asObservable().pipe(this.mapData((info) => info));
		this.showRight$ = this.showRight$$.asObservable().pipe(this.mapData((info) => info));
		this.showBottom$ = this.showBottom$$.asObservable().pipe(this.mapData((info) => info));
	}

	onMouseEnter() {
		this.showWidget$$.next(true);
		const rect = this.el.nativeElement.getBoundingClientRect();
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		this.showRight$$.next(rect.x < windowWidth / 2);
		this.showBottom$$.next(rect.y < windowHeight / 2);
	}

	onMouseLeave() {
		this.showWidget$$.next(false);
	}

	onClick(event: MouseEvent) {
		event.preventDefault();
		this.showWidget$$.next(false);
	}

	private getQuestIcon(type: RewardTrackType, hasXpBonus: boolean): string {
		switch (type) {
			case RewardTrackType.BATTLEGROUNDS:
				return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_bg.png';
			case RewardTrackType.GLOBAL:
			case RewardTrackType.NONE:
				if (hasXpBonus) {
					return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_boost.webp';
				} else {
					return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp.webp';
				}
			case RewardTrackType.EVENT:
			default:
				return 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_event.webp';
		}
	}
}

@Component({
	selector: 'hs-quests-list',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/overlays/quests/quests-widget-view.component.scss',
	],
	template: `
		<div class="container {{ theme }}">
			<ng-container *ngIf="quests?.length; else emptyState">
				<div class="quest" *ngFor="let quest of quests; trackBy: trackByQuestFn">
					<!-- TODO: different images for BG -->
					<div class="quest-portrait">
						<div class="xp" *ngIf="quest.xp">
							<img class="xp-icon" [src]="quest.xpIcon" />
							<div class="xp-value" [ngClass]="{ bonus: !!quest.xpBonus }">{{ quest.xp }}</div>
						</div>
					</div>
					<div class="quest-content">
						<!-- <div class="header">{{ task.header }}</div> -->
						<div class="description">{{ quest.description }}</div>
						<div class="progress">
							<div class="background"></div>
							<div class="current-progress" [style.width.%]="quest.progressPercentage"></div>
							<div class="text">{{ quest.progress }} / {{ quest.quota }}</div>
						</div>
					</div>
				</div>
			</ng-container>
			<ng-template #emptyState>
				<div class="empty-state" [owTranslate]="'quests.quests-completed'"></div>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQuestsListWidgetComponent {
	@Input() theme: string;
	@Input() quests: readonly Quest[];

	trackByQuestFn(index: number, item: Quest) {
		return item.name;
	}
}

interface Quest {
	readonly name: string;
	readonly description: string;
	readonly progress: number;
	readonly quota: number;
	readonly progressPercentage: number;
	readonly xp: number;
	readonly xpBonus: number;
	readonly xpIcon: string;
}
