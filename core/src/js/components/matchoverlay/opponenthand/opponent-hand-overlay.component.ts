import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'opponent-hand-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/matchoverlay/opponenthand/opponent-hand-overlay.component.scss',
	],
	template: `
		<div class="opponent-hand-overlay overlay-container-parent">
			<opponent-card-infos
				[cards]="hand$ | async"
				[displayTurnNumber]="displayTurnNumber$ | async"
				[displayGuess]="displayGuess$ | async"
				[displayBuff]="displayBuff$ | async"
			></opponent-card-infos>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class OpponentHandOverlayComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	hand$: Observable<readonly DeckCard[]>;
	displayTurnNumber$: Observable<boolean>;
	displayGuess$: Observable<boolean>;
	displayBuff$: Observable<boolean>;

	private windowId: string;
	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly init_DebugService: DebugService,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.hand$ = this.store
			.listenDeckState$((deckState) => deckState?.opponentDeck?.hand)
			.pipe(
				filter(([hand]) => !!hand?.length),
				distinctUntilChanged(arraysEqual),
				map(([hand]) => hand),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting hand in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
		this.displayTurnNumber$ = this.listenForBasicPref$((prefs) => prefs.dectrackerShowOpponentTurnDraw);
		this.displayGuess$ = this.listenForBasicPref$((prefs) => prefs.dectrackerShowOpponentGuess);
		this.displayBuff$ = this.listenForBasicPref$((prefs) => prefs.dectrackerShowOpponentBuffInHand);
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;
		const height = gameHeight * 0.8;
		const width = gameHeight;
		await this.ow.changeWindowSize(this.windowId, width, height);
		const dpi = gameInfo.logicalWidth / gameInfo.width;
		const newLeft = dpi * 0.5 * (gameWidth - width);
		await this.ow.changeWindowPosition(this.windowId, newLeft, 0);
	}
}
