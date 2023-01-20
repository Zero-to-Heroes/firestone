import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

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
export class DuelsMaxLifeWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	maxHealth$: Observable<number>;
	cssClass$: Observable<string>;

	@Input() set side(value: 'player' | 'opponent') {
		this._side.next(value);
	}

	private _side = new BehaviorSubject<'player' | 'opponent'>(null);

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.maxHealth$ = combineLatest(
			this._side.asObservable(),
			this.store.listenDeckState$((gameState) => gameState),
		).pipe(
			this.mapData(([side, [gameState]]) => {
				const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
				return deckState.hero?.maxHealth;
			}),
		);
		this.cssClass$ = this.store
			.listenPrefs$((prefs) => prefs.duelsShowMaxLifeWidget2)
			.pipe(this.mapData(([show]) => (show === 'blink' ? 'blinker' : '')));
	}
}
