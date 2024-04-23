import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsNextOpponentOverviewPanel, BgsPlayer, BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent, deepEqual, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

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
	opponents$: Observable<readonly BgsPlayer[]>;
	faceOffsByOpponent$: Observable<{ [opponentHeroCardId: string]: readonly BgsFaceOff[] }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly state: BgsStateFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.state);

		const currentPanel$: Observable<BgsNextOpponentOverviewPanel> = this.state.gameState$$.pipe(
			this.mapData((state) => ({
				panels: state.panels,
				currentPanelId: state.currentPanelId,
			})),
			filter(({ panels, currentPanelId }) => !!panels?.length && !!currentPanelId),
			this.mapData(
				({ panels, currentPanelId }) =>
					panels.find((panel) => panel.id === currentPanelId) as BgsNextOpponentOverviewPanel,
			),
		);
		this.nextOpponentCardId$ = currentPanel$.pipe(this.mapData((panel) => panel?.opponentOverview?.cardId));
		this.faceOffsByOpponent$ = this.state.gameState$$.pipe(
			this.mapData((state) => state.currentGame?.faceOffs),
			this.mapData(
				(faceOffs) => {
					const result = groupByFunction((faceOff: BgsFaceOff) =>
						normalizeHeroCardId(faceOff.opponentCardId, this.allCards),
					)(faceOffs ?? []);
					return result;
				},
				(a, b) => deepEqual(a, b),
			),
		);
		this.opponents$ = this.state.gameState$$.pipe(
			this.mapData((state) => state.currentGame?.players),
			filter((players) => !!players?.length),
			this.mapData(
				(players) =>
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
				(a, b) => deepEqual(a, b),
			),
			tap((info) =>
				console.debug(
					'opponents',
					info.map((o) => o.cardId),
				),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: BgsPlayer) {
		return item.cardId;
	}
}
