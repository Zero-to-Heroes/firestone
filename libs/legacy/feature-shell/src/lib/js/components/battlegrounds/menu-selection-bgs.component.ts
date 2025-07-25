import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { BgsPanelId, GameStateFacadeService } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'menu-selection-bgs',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/battlegrounds/menu-selection-bgs.component.scss`,
	],
	template: `
		<ul class="menu-selection" *ngIf="selectedPanel$ | async as selectedPanel">
			<li
				[ngClass]="{ selected: selectedPanel === 'bgs-hero-selection-overview' }"
				(mousedown)="selectStage('bgs-hero-selection-overview')"
			>
				<span [owTranslate]="'battlegrounds.menu.hero-selection'"></span>
			</li>
			<li
				[ngClass]="{ selected: selectedPanel === 'bgs-next-opponent-overview' }"
				(mousedown)="selectStage('bgs-next-opponent-overview')"
			>
				<span [owTranslate]="'battlegrounds.menu.opponent'"></span>
			</li>
			<li
				[ngClass]="{ selected: selectedPanel === 'bgs-post-match-stats' }"
				(mousedown)="selectStage('bgs-post-match-stats')"
			>
				<span>{{
					!(matchOver$ | async)
						? ('battlegrounds.menu.live-stats' | owTranslate)
						: ('battlegrounds.menu.post-match-stats' | owTranslate)
				}}</span>
			</li>
			<li [ngClass]="{ selected: selectedPanel === 'bgs-battles' }" (mousedown)="selectStage('bgs-battles')">
				<span [owTranslate]="'battlegrounds.menu.simulator'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionBgsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedPanel$: Observable<BgsPanelId>;
	matchOver$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: BgsInGameWindowNavigationService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.nav, this.gameState);

		this.selectedPanel$ = this.nav.currentPanelId$$.pipe(this.mapData((panelId) => panelId));
		this.matchOver$ = this.gameState.gameState$$.pipe(this.mapData((gameState) => gameState.gameEnded));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectStage(panelId: BgsPanelId) {
		this.nav.currentPanelId$$.next(panelId);
	}
}
