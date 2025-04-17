import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { BgsFaceOffWithSimulation, BgsNextOpponentOverviewPanel, BgsPlayer } from '@firestone/battlegrounds/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, takeUntil } from 'rxjs/operators';
import { AdService } from '../../../services/ad.service';

@Component({
	selector: 'bgs-next-opponent-overview',
	styleUrls: [`../../../../css/component/battlegrounds/in-game/bgs-next-opponent-overview.component.scss`],
	template: `
		<div
			class="container"
			*ngIf="{
				showNextOpponentRecapSeparately: showNextOpponentRecapSeparately$ | async,
				opponents: opponents$ | async,
				buddiesEnabled: buddiesEnabled$ | async,
				questsEnabled: questsEnabled$ | async
			} as value2"
			[ngClass]="{ 'no-opp-recap': !value2.showNextOpponentRecapSeparately }"
		>
			<div class="content" *ngIf="value2.opponents; else emptyState">
				<ng-container
					*ngIf="{
						currentTurn: currentTurn$ | async,
						lastOpponentPlayerId: lastOpponentPlayerId$ | async
					} as value"
				>
					<bgs-opponent-overview-big
						*ngIf="value2.showNextOpponentRecapSeparately"
						[opponent]="nextOpponent$ | async"
						[currentTurn]="value.currentTurn"
						[enableSimulation]="enableSimulation$ | async"
						[nextBattle]="nextBattle$ | async"
						[showQuestRewardsIfEmpty]="value2.questsEnabled"
						[buddiesEnabled]="value2.buddiesEnabled"
					></bgs-opponent-overview-big>
					<div class="other-opponents">
						<div class="subtitle" [owTranslate]="'battlegrounds.in-game.opponents.title'"></div>
						<div class="opponents" scrollable>
							<bgs-opponent-overview
								*ngFor="let opponent of value2.opponents; trackBy: trackByOpponentInfoFn"
								[opponent]="opponent"
								[currentTurn]="value.currentTurn"
								[showLastOpponentIcon]="isLastOpponent(opponent, value.lastOpponentPlayerId)"
								[buddiesEnabled]="value2.buddiesEnabled"
								[showQuestRewards]="value2.questsEnabled"
							></bgs-opponent-overview>
						</div>
					</div>
				</ng-container>
			</div>
			<ng-template #emptyState>
				<div class="content empty-state">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'battlegrounds.in-game.opponents.empty-state-title'"></span>
					<span
						class="subtitle"
						[owTranslate]="'battlegrounds.in-game.opponents.empty-state-subtitle'"
					></span></div
			></ng-template>
			<div class="left" *ngIf="!(showAds$ | async)">
				<div
					class="title"
					[helpTooltip]="'battlegrounds.in-game.opponents.score-board-tooltip' | owTranslate"
					[owTranslate]="'battlegrounds.in-game.opponents.score-board-title'"
				></div>
				<bgs-hero-face-offs *ngIf="value2.opponents?.length"></bgs-hero-face-offs>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsNextOpponentOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableSimulation$: Observable<boolean>;
	showNextOpponentRecapSeparately$: Observable<boolean>;
	showAds$: Observable<boolean>;
	nextOpponentCardId$: Observable<string>;
	opponents$: Observable<readonly BgsPlayer[]>;
	nextOpponent$: Observable<BgsPlayer>;
	currentTurn$: Observable<number>;
	nextBattle$: Observable<BgsFaceOffWithSimulation>;
	lastOpponentPlayerId$: Observable<number>;

	buddiesEnabled$: Observable<boolean>;
	questsEnabled$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly state: BgsStateFacadeService,
		private readonly prefs: PreferencesService,
		private readonly ads: AdService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.state.isReady(), this.prefs.isReady(), this.ads.isReady()]);

		this.enableSimulation$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsEnableSimulation));
		this.showNextOpponentRecapSeparately$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowNextOpponentRecapSeparately),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((showAds) => !showAds));
		this.buddiesEnabled$ = this.state.gameState$$.pipe(this.mapData((state) => state?.currentGame?.hasBuddies));
		this.questsEnabled$ = this.state.gameState$$.pipe(this.mapData((state) => state?.currentGame?.hasQuests));
		this.currentTurn$ = this.state.gameState$$.pipe(this.mapData((state) => state?.currentGame?.currentTurn));
		const currentPanel$: Observable<BgsNextOpponentOverviewPanel> = this.state.gameState$$.pipe(
			this.mapData(
				(state) =>
					state.panels?.find((panel) => panel.id === state.currentPanelId) as BgsNextOpponentOverviewPanel,
			),
		);
		this.nextOpponentCardId$ = currentPanel$.pipe(this.mapData((panel) => panel?.opponentOverview?.cardId));
		this.lastOpponentPlayerId$ = this.state.gameState$$.pipe(
			this.mapData((state) => state.currentGame?.lastOpponentPlayerId),
		);
		this.nextBattle$ = this.state.gameState$$.pipe(this.mapData((state) => state.currentGame?.lastFaceOff()));
		const opponents$ = this.state.gameState$$.pipe(
			debounceTime(1000),
			map((state) => state.currentGame?.players),
			filter((players) => !!players?.length),
			distinctUntilChanged(),
			this.mapData((players) =>
				[...players].sort((a, b) => {
					if (a.leaderboardPlace < b.leaderboardPlace) {
						return -1;
					}
					if (b.leaderboardPlace < a.leaderboardPlace) {
						return 1;
					}
					if (a.damageTaken < b.damageTaken) {
						return -1;
					}
					if (b.damageTaken < a.damageTaken) {
						return 1;
					}
					return 0;
				}),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.opponents$ = opponents$.pipe(
			filter((opponents) => opponents?.length >= 8),
			takeUntil(this.destroyed$),
		);
		this.nextOpponent$ = combineLatest([this.nextOpponentCardId$, opponents$]).pipe(
			this.mapData(([nextOpponentCardId, opponents]) =>
				opponents.find((opp) => opp.cardId === nextOpponentCardId),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByOpponentInfoFn(index, item: BgsPlayer) {
		return item.cardId;
	}

	isLastOpponent(opponent: BgsPlayer, lastOpponentPlayerId: number): boolean {
		const result = opponent.playerId === lastOpponentPlayerId;
		return result;
	}
}
