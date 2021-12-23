import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Race, SceneMode } from '@firestone-hs/reference-data';
import {} from 'jszip';
import {} from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../services/utils';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-board-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-board-widget-wrapper.component.scss'],
	template: `
		<ng-container
			*ngIf="{
				showTribesHighlight: showTribesHighlight$ | async,
				highlightedTribes: highlightedTribes$ | async,
				highlightedMinions: highlightedMinions$ | async
			} as value"
		>
			<div class="board-container" *ngIf="showWidget$ | async">
				<ul class="board" *ngIf="minionCardIds$ | async as minionCardIds">
					<bgs-tavern-minion
						class="tavern-minion"
						*ngFor="let minion of minionCardIds; trackBy: trackByMinion"
						[minion]="minion"
						[showTribesHighlight]="value.showTribesHighlight"
						[highlightedTribes]="value.highlightedTribes"
						[highlightedMinions]="value.highlightedMinions"
					></bgs-tavern-minion>
				</ul>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBoardWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.15;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) =>
		(dpi * gameHeight) / 3;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;

	private visible: boolean;

	showWidget$: Observable<boolean>;
	minionCardIds$: Observable<readonly string[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMinions$: Observable<readonly string[]>;
	showTribesHighlight$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	ngAfterContentInit(): void {
		this.showWidget$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => main.currentScene),
			this.store.listenBattlegrounds$(
				([state]) => state?.inGame,
				([state]) => state?.currentGame?.gameEnded,
			),
		).pipe(
			this.mapData(
				([[currentScene], [inGame, gameEnded]]) => currentScene === SceneMode.GAMEPLAY && inGame && !gameEnded,
			),
		);
		this.minionCardIds$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state.currentGame?.phase),
			this.store.listenDeckState$((state) => state?.opponentDeck?.board),
		).pipe(
			debounceTime(500),
			filter(([[phase], [opponentBoard]]) => !!phase && !!opponentBoard),
			map(([[phase], [opponentBoard]]) =>
				phase === 'recruit' ? opponentBoard.map((minion) => minion.cardId) : [],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((info) => cdLog('emitting minions in ', this.constructor.name, info)),
			takeUntil(this.destroyed$),
		);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedTribes)
			.pipe(
				map(([highlightedTribes]) => highlightedTribes),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting highlightedTribes in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedMinions)
			.pipe(
				map(([highlightedMinions]) => highlightedMinions),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting highlightedMinions in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.showTribesHighlight$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(
				map(([bgsShowTribesHighlight]) => bgsShowTribesHighlight),
				distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting showTribesHighlight in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}

	trackByMinion(index: number, minion: string) {
		return index;
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		console.debug('resizing window', gameInfo);
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		console.debug('new size', this.windowWidth, this.windowHeight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
