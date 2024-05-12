import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Component({
	selector: 'duels-max-life-widget',
	styleUrls: ['../../../../css/component/overlays/duels-max-life/duels-max-life-widget.component.scss'],
	template: `
		<div class="duels-max-life-widget" *ngIf="maxHealth$ | async as maxHealth">
			<div class="health {{ cssClass$ | async }}">
				<img src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/health.png" class="icon" />
				<div class="value-container">
					<div class="value">{{ maxHealth }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMaxLifeWidgetComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	maxHealth$: Observable<number>;
	cssClass$: Observable<string>;

	@Input() set side(value: 'player' | 'opponent') {
		this._side.next(value);
	}

	private _side = new BehaviorSubject<'player' | 'opponent'>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.gameState);

		this.maxHealth$ = combineLatest([this._side.asObservable(), this.gameState.gameState$$]).pipe(
			this.mapData(([side, gameState]) => {
				const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
				return deckState.hero?.maxHealth;
			}),
		);
		this.cssClass$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => (prefs.duelsShowMaxLifeWidget2 === 'blink' ? 'blinker' : '')),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
