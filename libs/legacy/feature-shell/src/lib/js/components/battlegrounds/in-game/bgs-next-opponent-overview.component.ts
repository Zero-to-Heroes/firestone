import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-next-opponent-overview',
	styleUrls: [`../../../../css/component/battlegrounds/in-game/bgs-next-opponent-overview.component.scss`],
	template: `
		<div
			class="container"
			*ngIf="{
				showNextOpponentRecapSeparately: showNextOpponentRecapSeparately$ | async,
				opponents: opponents$ | async,
				buddiesEnabled: buddiesEnabled$ | async
			} as value2"
			[ngClass]="{ 'no-ads': !(showAds$ | async), 'no-opp-recap': !value2.showNextOpponentRecapSeparately }"
		>
			<div class="content" *ngIf="value2.opponents; else emptyState">
				<ng-container
					*ngIf="{
						currentTurn: currentTurn$ | async,
						lastOpponentCardId: lastOpponentCardId$ | async
					} as value"
				>
					<bgs-opponent-overview-big
						*ngIf="value2.showNextOpponentRecapSeparately"
						[opponent]="nextOpponent$ | async"
						[currentTurn]="value.currentTurn"
						[enableSimulation]="enableSimulation$ | async"
						[nextBattle]="nextBattle$ | async"
						[buddiesEnabled]="value2.buddiesEnabled"
					></bgs-opponent-overview-big>
					<div class="other-opponents">
						<div class="subtitle" [owTranslate]="'battlegrounds.in-game.opponents.title'"></div>
						<div class="opponents" scrollable>
							<bgs-opponent-overview
								*ngFor="let opponent of value2.opponents; trackBy: trackByOpponentInfoFn"
								[opponent]="opponent"
								[currentTurn]="value.currentTurn"
								[showLastOpponentIcon]="isLastOpponent(opponent, lastOpponentCardId$ | async)"
								[buddiesEnabled]="value2.buddiesEnabled"
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
			<div class="left">
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
export class BgsNextOpponentOverviewComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	enableSimulation$: Observable<boolean>;
	showNextOpponentRecapSeparately$: Observable<boolean>;
	showAds$: Observable<boolean>;
	nextOpponentCardId$: Observable<string>;
	opponents$: Observable<readonly BgsPlayer[]>;
	nextOpponent$: Observable<BgsPlayer>;
	currentTurn$: Observable<number>;
	nextBattle$: Observable<BgsFaceOffWithSimulation>;
	lastOpponentCardId$: Observable<string>;

	buddiesEnabled$: Observable<boolean>;

	opponentsSubject$$ = new BehaviorSubject<readonly BgsPlayer[]>([]);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.enableSimulation$ = this.store
			.listen$(([main, nav, prefs]) => prefs.bgsEnableSimulation)
			.pipe(this.mapData(([pref]) => pref));
		this.showNextOpponentRecapSeparately$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsShowNextOpponentRecapSeparately,
		);
		this.showAds$ = this.store.showAds$().pipe(this.mapData((showAds) => showAds));
		this.buddiesEnabled$ = this.store
			.listenBattlegrounds$(([state]) => state?.currentGame?.hasBuddies)
			.pipe(this.mapData(([hasBuddies]) => hasBuddies));
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([state, prefs]) => state?.currentGame?.currentTurn)
			.pipe(this.mapData(([turn]) => turn));
		const currentPanel$: Observable<BgsNextOpponentOverviewPanel> = this.store
			.listenBattlegrounds$(
				([state]) => state.panels,
				([state]) => state.currentPanelId,
			)
			.pipe(
				filter(([panels, currentPanelId]) => !!panels?.length && !!currentPanelId),
				this.mapData(
					([panels, currentPanelId]) =>
						panels.find((panel) => panel.id === currentPanelId) as BgsNextOpponentOverviewPanel,
					(a, b) => deepEqual(a, b),
				),
			);
		this.nextOpponentCardId$ = currentPanel$.pipe(this.mapData((panel) => panel?.opponentOverview?.cardId));
		this.lastOpponentCardId$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.lastOpponentCardId)
			.pipe(this.mapData(([lastOpponentCardId]) => lastOpponentCardId));
		this.nextBattle$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				filter(([game]) => !!game),
				this.mapData(([game]) => game.lastFaceOff()),
			);
		this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.players)
			.pipe(
				debounceTime(1000),
				filter(([players]) => !!players?.length),
				this.mapData(
					([players]) =>
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
					deepEqual,
				),
			)
			.subscribe((opponents) => this.opponentsSubject$$.next(opponents));
		this.opponents$ = this.opponentsSubject$$.asObservable().pipe(
			filter((opponents) => opponents?.length >= 8),
			takeUntil(this.destroyed$),
		);
		this.nextOpponent$ = combineLatest(this.nextOpponentCardId$, this.opponentsSubject$$.asObservable()).pipe(
			this.mapData(([nextOpponentCardId, opponents]) =>
				opponents.find((opp) => opp.cardId === nextOpponentCardId),
			),
		);
	}

	trackByOpponentInfoFn(index, item: BgsPlayer) {
		return item.cardId;
	}

	isLastOpponent(opponent: BgsPlayer, lastOpponentCardId: string): boolean {
		const result = normalizeHeroCardId(opponent.cardId, this.allCards) === lastOpponentCardId;
		return result;
	}
}
