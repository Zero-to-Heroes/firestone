import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, GameStateFacadeService, Metadata } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { auditTime, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'opponent-hand-overlay',
	styleUrls: ['../../../../css/component/overlays/opponenthand/opponent-hand-overlay.component.scss'],
	template: `
		<div class="opponent-hand-overlay">
			<opponent-card-infos
				[cards]="hand$ | async"
				[context]="context$ | async"
				[displayTurnNumber]="displayTurnNumber$ | async"
				[displayGuess]="displayGuess$ | async"
				[displayBuff]="displayBuff$ | async"
			></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentHandOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	hand$: Observable<readonly DeckCard[]>;
	displayTurnNumber$: Observable<boolean>;
	displayGuess$: Observable<boolean>;
	displayBuff$: Observable<boolean>;
	context$: Observable<{ deck: DeckState; gameState: GameState; metadata: Metadata; currentTurn: number | 'mulligan' }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly gameState: GameStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.prefs);

		this.hand$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			this.mapData((gameState) => gameState?.opponentDeck?.hand),
			this.mapData((hand) =>
				[...hand].sort((a, b) => a.tags[GameTag.ZONE_POSITION] - b.tags[GameTag.ZONE_POSITION]),
			),
			// Might be too expensive to use deepEqual here, as it will compare the whole hand
			// distinctUntilChanged((a, b) => deepEq(a, b)),
		);
		this.context$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			this.mapData((gameState) => ({
				deck: gameState?.opponentDeck,
				gameState: gameState,
				metadata: gameState?.metadata,
				currentTurn: gameState?.currentTurn,
			})),
		);
		this.displayTurnNumber$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.dectrackerShowOpponentTurnDraw),
		);
		this.displayGuess$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.dectrackerShowOpponentGuess));
		this.displayBuff$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.dectrackerShowOpponentBuffInHand),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
