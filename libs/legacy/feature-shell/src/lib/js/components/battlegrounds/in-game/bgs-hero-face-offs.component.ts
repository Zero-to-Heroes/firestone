import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { BgsNextOpponentOverviewPanel, GameStateFacadeService } from '@firestone/game-state';
import { AbstractSubscriptionComponent, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, Observable } from 'rxjs';
import { auditTime, distinctUntilChanged, filter, shareReplay, takeUntil } from 'rxjs/operators';
import { FaceOffHero, faceOfHeroesArrayEqual } from './bgs-hero-face-off.component';

@Component({
	selector: 'bgs-hero-face-offs',
	styleUrls: [`../../../../css/component/battlegrounds/in-game/bgs-hero-face-offs.component.scss`],
	template: `
		<div class="face-offs" scrollable>
			<div class="header entry">
				<div class="hero" [owTranslate]="'battlegrounds.in-game.face-offs.header.hero'"></div>
				<div class="won" [owTranslate]="'battlegrounds.in-game.face-offs.header.won'"></div>
				<div class="lost" [owTranslate]="'battlegrounds.in-game.face-offs.header.lost'"></div>
				<div class="tied" [owTranslate]="'battlegrounds.in-game.face-offs.header.tied'"></div>
			</div>
			<ng-container
				*ngIf="{
					nextOpponentCardId: nextOpponentCardId$ | async,
					opponents: opponents$ | async,
					faceOffs: faceOffsByOpponent$ | async
				} as value"
			>
				<bgs-hero-face-off
					*ngFor="let opponent of value.opponents || []; trackBy: trackByFn"
					[opponent]="opponent"
					[isNextOpponent]="value.nextOpponentCardId === opponent.cardId"
					[faceOffs]="value.faceOffs && value.faceOffs[opponent.cardId]"
				></bgs-hero-face-off>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	nextOpponentCardId$: Observable<string>;
	opponents$: Observable<readonly FaceOffHero[]>;
	faceOffsByOpponent$: Observable<{ [opponentHeroCardId: string]: readonly BgsFaceOff[] }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly state: GameStateFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.state, this.nav);

		const currentPanel$: Observable<BgsNextOpponentOverviewPanel> = combineLatest([
			this.state.gameState$$,
			this.nav.currentPanelId$$,
		]).pipe(
			auditTime(1000),
			this.mapData(
				([state, panelId]) =>
					state.bgState.panels?.find((panel) => panel.id === panelId) as BgsNextOpponentOverviewPanel,
			),
		);
		this.faceOffsByOpponent$ = this.state.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => state.bgState.currentGame?.faceOffs),
			distinctUntilChanged(),
			this.mapData((faceOffs) => {
				const result = groupByFunction((faceOff: BgsFaceOff) =>
					normalizeHeroCardId(faceOff.opponentCardId, this.allCards),
				)(faceOffs ?? []);
				return result;
			}),
		);
		const players$ = this.state.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => state.bgState.currentGame?.players),
			filter((players) => !!players?.length),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.opponents$ = players$.pipe(
			distinctUntilChanged((a, b) => faceOfHeroesArrayEqual(a, b)),
			this.mapData((players) =>
				players
					.filter((player) => !player.isMainPlayer)
					.sort((a, b) => {
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
		);
		this.nextOpponentCardId$ = combineLatest([currentPanel$, players$]).pipe(
			this.mapData(([panel, players]) => {
				const playerId = panel?.opponentOverview?.playerId;
				const opponent = players?.find((opponent) => opponent.playerId === playerId);
				return opponent?.cardId;
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: FaceOffHero) {
		return item.cardId;
	}
}
