import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { QuestStatus } from '@firestone-hs/reference-data';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

@Component({
	selector: 'hs-quests-widget',
	styleUrls: [
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/quests/hs-quests-widget.component.scss',
	],
	template: `
		<div class="quests-widget decktracker-theme">
			<div
				class="widget-icon"
				*ngIf="showQuests$ | async"
				(mouseenter)="onMouseEnter()"
				(mouseleave)="onMouseLeave()"
				(click)="onMouseLeave()"
				(mousedown)="onMouseLeave()"
				(mouseup)="onMouseLeave()"
			>
				<img src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/quest_log_2.png" />
			</div>
			<hs-quests-list
				class="quests-container"
				[ngClass]="{
					'visible': showQuestsDetails$ | async,
					'right': showRight$ | async,
					'bottom': showBottom$ | async
				}"
				[quests]="quests$ | async"
			>
			</hs-quests-list>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsQuestsWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		this.quests$ = this.store
			.listen$(
				([main, nav]) => main.quests.getReferenceQuests(),
				([main, nav]) => main.quests.activeQuests,
				([main, nav]) => main.quests.xpBonus,
			)
			.pipe(
				this.mapData(([referenceQuests, activeQuests, xpBonus]) => {
					return activeQuests?.Quests?.filter((q) =>
						[QuestStatus.NEW, QuestStatus.ACTIVE].includes(q.Status),
					).map((quest) => {
						const refQuest = referenceQuests?.quests?.find((q) => q.id === quest.Id);
						const result: Quest = {
							name: refQuest?.name ?? 'Unknown quest',
							description:
								refQuest?.description?.replace('$q', '' + refQuest?.quota) ?? 'Unknown description',
							quota: refQuest?.quota,
							progress: quest.Progress ?? 0,
							progressPercentage: !!refQuest?.quota ? (100 * (quest.Progress ?? 0)) / refQuest.quota : 0,
							xp: refQuest?.rewardTrackXp * (1 + (xpBonus ?? 0) / 100),
							xpBonus: xpBonus,
						};
						return result;
					});
				}),
			);
		this.showQuests$ = combineLatest(
			this.store.listenPrefs$(
				(prefs) => prefs.hsShowQuestsWidget,
				(prefs) => prefs.showQuestsWidgetWhenEmpty,
			),
			this.quests$,
		).pipe(
			this.mapData(([[showQuests, showWhenEmpty], quests]) => {
				return showQuests && (!!quests?.length || showWhenEmpty);
			}),
		);
		this.showQuestsDetails$ = this.showWidget$$.asObservable().pipe(
			// tap((info) => console.debug('show', info)),
			this.mapData((info) => info),
		);
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
}

@Component({
	selector: 'hs-quests-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/themes/decktracker-theme.scss`,
		'../../../../css/component/overlays/quests/hs-quests-widget.component.scss',
	],
	template: `
		<div class="container">
			<ng-container *ngIf="quests?.length; else emptyState">
				<div class="quest" *ngFor="let quest of quests; trackBy: trackByQuestFn">
					<div class="quest-portrait">
						<!-- <img
								class="icon"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/empty_quest.png"
							/> -->
						<div class="xp" *ngIf="quest.xp">
							<img
								*ngIf="!quest.xpBonus"
								class="xp-icon"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp.webp"
							/>
							<img
								*ngIf="quest.xpBonus"
								class="xp-icon"
								src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/reward_track_xp_boost.webp"
							/>
							<div class="xp-value" [ngClass]="{ 'bonus': !!quest.xpBonus }">{{ quest.xp }}</div>
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
	@Input() quests: readonly Quest[];
}

interface Quest {
	readonly name: string;
	readonly description: string;
	readonly progress: number;
	readonly quota: number;
	readonly progressPercentage: number;
	readonly xp: number;
	readonly xpBonus: number;
}
