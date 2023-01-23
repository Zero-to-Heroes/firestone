import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameTag, Race, SceneMode } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import {} from 'jszip';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-board-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/bgs-board-widget-wrapper.component.scss'],
	template: `
		<ng-container
			*ngIf="{
				showTribesHighlight: showTribesHighlight$ | async,
				highlightedTribes: highlightedTribes$ | async,
				highlightedMechanics: highlightedMechanics$ | async,
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
						[highlightedMechanics]="value.highlightedMechanics"
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
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number, dpi: number) => gameHeight * 0.3;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.board-container')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	minionCardIds$: Observable<readonly string[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMechanics$: Observable<readonly GameTag[]>;
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
			this.handleReposition(),
		);
		this.minionCardIds$ = combineLatest(
			this.store.listenBattlegrounds$(([state]) => state.currentGame?.phase),
			this.store.listenDeckState$((state) => state?.opponentDeck?.board),
		).pipe(
			debounceTime(500),
			filter(([[phase], [opponentBoard]]) => !!phase && !!opponentBoard),
			this.mapData(([[phase], [opponentBoard]]) =>
				phase === 'recruit' ? opponentBoard.map((minion) => minion.cardId) : [],
			),
		);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedTribes)
			.pipe(this.mapData(([highlightedTribes]) => highlightedTribes));
		this.highlightedMechanics$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedMechanics)
			.pipe(this.mapData(([highlightedMechanics]) => highlightedMechanics));
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([state]) => state.highlightedMinions)
			.pipe(this.mapData(([highlightedMinions]) => highlightedMinions));
		this.showTribesHighlight$ = this.store
			.listen$(([state, nav, prefs]) => prefs.bgsShowTribesHighlight)
			.pipe(this.mapData(([bgsShowTribesHighlight]) => bgsShowTribesHighlight));
	}

	trackByMinion(index: number, minion: string) {
		return index;
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.12;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
