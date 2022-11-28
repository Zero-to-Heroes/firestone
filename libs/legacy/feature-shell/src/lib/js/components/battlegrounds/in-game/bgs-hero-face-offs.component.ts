import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { deepEqual, groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-hero-face-offs',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-hero-face-offs.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
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

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
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
				),
			);
		this.nextOpponentCardId$ = currentPanel$.pipe(this.mapData((panel) => panel?.opponentOverview?.cardId));
		this.faceOffsByOpponent$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				this.mapData(
					([faceOffs]) => groupByFunction((faceOff: BgsFaceOff) => faceOff.opponentCardId)(faceOffs ?? []),
					(a, b) => deepEqual(a, b),
				),
			);
		this.opponents$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.players)
			.pipe(
				filter(([players]) => !!players?.length),
				this.mapData(
					([players]) =>
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
			);
	}

	trackByFn(index, item: BgsPlayer) {
		return item.cardId;
	}
}
