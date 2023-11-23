import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, SceneMode } from '@firestone-hs/reference-data';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { SceneService } from '../../services/game/scene.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'bgs-banned-tribes-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-banned-tribes
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-banned-tribes>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribesWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth / 2 + 300;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsBannedTribedPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsBannedTribesWidgetPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

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
			this.store.listen$(([main, nav, prefs]) => prefs.bgsShowBannedTribesOverlay && prefs.bgsFullToggle),
			this.store.listenBattlegrounds$(
				([state, prefs]) => state?.inGame,
				([state, prefs]) => !!state?.currentGame,
				([state, prefs]) => state?.currentGame?.anomalies,
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [inGame, isCurrentGame, anomalies]]) => {
				return (
					inGame &&
					isCurrentGame &&
					displayFromPrefs &&
					currentScene === SceneMode.GAMEPLAY &&
					!anomalies?.includes(CardIds.TavernSpecial_BG27_Anomaly_103)
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
