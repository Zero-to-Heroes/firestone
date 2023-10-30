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
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { SceneService } from '../../services/game/scene.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-minion-tiers-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<battlegrounds-minions-tiers
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></battlegrounds-minions-tiers>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinionsTiersWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 252;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 20;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsMinionsListPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsMinionsListPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -150,
		top: -20,
		right: -150,
		bottom: -20,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(
				([main, nav, prefs]) =>
					(prefs.bgsEnableMinionListOverlay || prefs.bgsEnableTurnNumbertOverlay) && prefs.bgsFullToggle,
			),
			this.store.listenBattlegrounds$(
				([state, prefs]) => state?.inGame,
				([state, prefs]) => !!state?.currentGame,
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [inGame, isCurrentGame]]) => {
				return inGame && isCurrentGame && displayFromPrefs && currentScene === SceneMode.GAMEPLAY;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
