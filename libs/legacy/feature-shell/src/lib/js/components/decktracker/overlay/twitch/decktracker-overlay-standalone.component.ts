import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { DeckState, GameState } from '@firestone/game-state';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { AbstractSubscriptionTwitchResizableComponent, TwitchPreferencesService } from '@firestone/twitch/common';
import { BehaviorSubject, combineLatest, debounceTime, filter, Observable, takeUntil } from 'rxjs';
import { CardsHighlightStandaloneService } from './cards-highlight-standalone.service';

@Component({
	selector: 'decktracker-overlay-standalone',
	styleUrls: [
		`../../../../../css/themes/decktracker-theme.scss`,
		`../../../../../css/global/cdk-overlay.scss`,
		'../../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'./decktracker-overlay-standalone.component.scss',
	],
	template: `
		<div
			*ngIf="playerDeck && showTracker$ | async"
			class="root active decktracker-theme"
			[ngClass]="{ dragging: dragging }"
			[activeTheme]="'decktracker'"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
		>
			<div class="scalable">
				<div class="decktracker-container">
					<div class="decktracker" *ngIf="playerDeck">
						<decktracker-twitch-title-bar [deckState]="playerDeck"> </decktracker-twitch-title-bar>
						<decktracker-deck-list
							*ngIf="playerDeck?.deck?.length > 0"
							[deckState]="playerDeck"
							[displayMode]="displayMode$ | async"
							[tooltipPosition]="tooltipPosition"
							[showRelatedCards]="showRelatedCards$ | async"
							[colorManaCost]="colorManaCost$ | async"
							[darkenUsedCards]="true"
							[showTotalCardsInZone]="true"
							[showBottomCardsSeparately]="true"
							[showTopCardsSeparately]="true"
							[side]="side$ | async"
						>
						</decktracker-deck-list>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayStandaloneComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterContentInit, AfterViewInit
{
	displayMode$: Observable<'DISPLAY_MODE_ZONE' | 'DISPLAY_MODE_GROUPED'>;
	showRelatedCards$ = new Observable<boolean>();
	showTracker$: Observable<boolean>;
	colorManaCost$: Observable<boolean>;
	side$: Observable<'player' | 'opponent'>;

	@Input() set side(value: 'player' | 'opponent') {
		this.side$$.next(value);
	}

	@Input() set gameState(value: GameState) {
		this.gameState$$.next(value);
	}

	playerDeck: DeckState;
	dragging: boolean;
	tooltipPosition: CardTooltipPositionType = 'left';

	private gameState$$ = new BehaviorSubject<GameState>(null);
	private side$$ = new BehaviorSubject<'player' | 'opponent'>('player');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly allCards: CardsFacadeService,
		private readonly highlightService: CardsHighlightStandaloneService,
	) {
		super(cdr, prefs, el, renderer);
	}

	ngAfterContentInit() {
		combineLatest([this.gameState$$, this.side$$])
			.pipe(
				filter(([gameState, side]) => !!gameState && !!side),
				debounceTime(100),
				takeUntil(this.destroyed$),
			)
			.subscribe(([gameState, side]) => {
				this.playerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
		this.side$ = this.side$$.asObservable();
		this.displayMode$ = this.prefs.prefs
			.asObservable()
			.pipe(this.mapData((prefs) => (prefs?.useModernTracker ? 'DISPLAY_MODE_ZONE' : 'DISPLAY_MODE_GROUPED')));
		this.showRelatedCards$ = this.prefs.prefs.asObservable().pipe(this.mapData((prefs) => prefs?.showRelatedCards));
		this.showTracker$ = this.prefs.prefs.asObservable().pipe(this.mapData((prefs) => prefs?.decktrackerOpen));
		this.colorManaCost$ = this.prefs.prefs
			.asObservable()
			.pipe(this.mapData((prefs) => prefs?.decktrackerColorManaCost));
		this.highlightService.setup(this.gameState$$);
	}

	ngAfterViewInit() {
		super.listenForResize();
	}

	protected postResize() {
		this.keepOverlayInBounds();
	}

	private keepOverlayInBounds() {
		return;
	}

	startDragging() {
		this.tooltipPosition = 'none';
		this.dragging = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		this.dragging = false;
		await this.updateTooltipPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.keepOverlayInBounds();
	}

	private async updateTooltipPosition() {
		// Move the tracker so that it doesn't go over the edges
		const rect = this.el.nativeElement.querySelector('.scalable').getBoundingClientRect();
		if (rect.left < 300) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
