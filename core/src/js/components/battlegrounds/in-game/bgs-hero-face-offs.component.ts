import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
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
				<div class="hero">Hero</div>
				<div class="won">Won</div>
				<div class="lost">Lost</div>
				<div class="tied">Tied</div>
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
					[faceOffs]="value.faceOffs[opponent.cardId]"
				></bgs-hero-face-off>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffsComponent extends AbstractSubscriptionComponent {
	nextOpponentCardId$: Observable<string>;
	opponents$: Observable<readonly BgsPlayer[]>;
	faceOffsByOpponent$: Observable<{ [opponentHeroCardId: string]: readonly BgsFaceOff[] }>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreFacadeService) {
		super();
		const currentPanel$: Observable<BgsNextOpponentOverviewPanel> = this.store
			.listenBattlegrounds$(
				([state]) => state.panels,
				([state]) => state.currentPanelId,
			)
			.pipe(
				filter(([panels, currentPanelId]) => !!panels?.length && !!currentPanelId),
				map(
					([panels, currentPanelId]) =>
						panels.find((panel) => panel.id === currentPanelId) as BgsNextOpponentOverviewPanel,
				),
				filter((panel) => !!panel?.opponentOverview),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.nextOpponentCardId$ = currentPanel$.pipe(
			map((panel) => panel.opponentOverview.cardId),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			takeUntil(this.destroyed$),
		);
		this.faceOffsByOpponent$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.faceOffs)
			.pipe(
				filter(([faceOffs]) => !!faceOffs?.length),
				map(([faceOffs]) => groupByFunction((faceOff: BgsFaceOff) => faceOff.opponentCardId)(faceOffs)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
		this.opponents$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.players)
			.pipe(
				filter(([players]) => !!players?.length),
				map(([players]) =>
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
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFn(index, item: BgsPlayer) {
		return item.cardId;
	}
}
