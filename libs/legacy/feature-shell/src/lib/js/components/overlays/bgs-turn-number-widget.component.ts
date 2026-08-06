import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

/**
 * Lightweight turn badge for when only bgsEnableTurnNumbertOverlay is on
 * (full minion-list overlay stays unmounted — no getAllCardsInGame / tier trees).
 */
@Component({
	standalone: false,
	selector: 'bgs-turn-number-widget',
	styleUrls: ['./bgs-turn-number-widget.component.scss'],
	template: `
		<div class="bgs-turn-number-widget battlegrounds-theme scalable" *ngIf="currentTurn$ | async as currentTurn">
			<div class="logo-container">
				<div class="background-main-part"></div>
				<div class="background-second-part"></div>
				<div
					class="turn-number"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: currentTurn }"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTurnNumberWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	currentTurn$: Observable<number>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState);

		this.currentTurn$ = this.gameState.gameState$$.pipe(this.mapData((main) => main.currentTurnNumeric));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
