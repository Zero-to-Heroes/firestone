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
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'bgs-hero-tips-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<bgs-hero-tips
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></bgs-hero-tips>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTipsWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => (2 * gameWidth) / 3;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 200;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateBgsHeroTipsPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.bgsHeroTipsWidgetPosition;
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
		private readonly ads: AdService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await Promise.all([this.scene.isReady(), this.ads.isReady()]);

		this.showWidget$ = combineLatest([
			this.ads.enablePremiumFeatures$$,
			this.scene.currentScene$$,
			this.store.listen$(([main, nav, prefs]) => prefs.bgsShowHeroTipsOverlay && prefs.bgsFullToggle),
			this.store.listenBattlegrounds$(
				([state, prefs]) => state?.inGame,
				([state, prefs]) => state?.currentGame,
			),
		]).pipe(
			this.mapData(([premium, currentScene, [displayFromPrefs], [inGame, currentGame]]) => {
				return (
					premium &&
					inGame &&
					currentGame?.getMainPlayer()?.cardId &&
					displayFromPrefs &&
					currentScene === SceneMode.GAMEPLAY
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
