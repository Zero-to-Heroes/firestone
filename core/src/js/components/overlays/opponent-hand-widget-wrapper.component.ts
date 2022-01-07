import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'opponent-hand-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<opponent-hand-overlay
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></opponent-hand-overlay>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentHandWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0.5 * (gameWidth - gameHeight);
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;

	private visible: boolean;

	showWidget$: Observable<boolean>;
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
			this.store.listen$(
				([main, nav, prefs]) => main.currentScene,
				// Show from prefs
				([main, nav, prefs]) => prefs.dectrackerShowOpponentGuess || prefs.dectrackerShowOpponentTurnDraw,
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
			),
		).pipe(
			// tap((info) => console.debug('info', info)),
			this.mapData(([[currentScene, displayFromPrefs], [gameStarted, gameEnded, isBgs, isMercs]]) => {
				if (!gameStarted || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				return !gameEnded;
			}),
		);
		this.showWidget$.pipe(distinctUntilChanged(), takeUntil(this.destroyed$)).subscribe((show) => {
			this.visible = show;
			this.reposition();
		});
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		console.debug('resizing window', gameInfo);
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight;
		this.windowHeight = gameHeight * 0.1;
		console.debug('new size', this.windowWidth, this.windowHeight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
