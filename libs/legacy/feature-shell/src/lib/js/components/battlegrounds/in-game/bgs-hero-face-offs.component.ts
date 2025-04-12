import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { BgsNextOpponentOverviewPanel } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent, deepEqual, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
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
			distinctUntilChanged((a, b) => faceOfHeroesArrayEqual(a, b)),
			this.mapData((players) =>
				players
					.filter((player) => !player.isMainPlayer)
					// .map((player) => {
					// 	const result: FaceOffHero = {
					// 		cardId: player.cardId,
					// 		displayedCardId: player.displayedCardId,
					// 		name: player.name,
					// 		currentArmor: player.currentArmor,
					// 		damageTaken: player.damageTaken,
					// 		initialHealth: player.initialHealth,
					// 		leaderboardPlace: player.leaderboardPlace,
					// 	};
					// 	return result;
					// })
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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: FaceOffHero) {
		return item.cardId;
	}
}
