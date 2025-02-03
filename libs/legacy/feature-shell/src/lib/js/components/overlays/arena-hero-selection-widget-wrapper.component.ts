import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { DraftSlotType, SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, filter, switchMap } from 'rxjs';
import { ArenaDraftManagerService } from '../../services/arena/arena-draft-manager.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'arena-hero-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: ` <arena-hero-selection class="widget" *ngIf="showWidget$ | async"></arena-hero-selection> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly arenaDraftManager: ArenaDraftManagerService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.arenaDraftManager);

		this.showWidget$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaShowHeroSelectionOverlay),
			filter((displayFromPrefs) => displayFromPrefs),
			switchMap(() => this.scene.currentScene$$),
			filter((currentScene) => currentScene === SceneMode.DRAFT),
			switchMap(() => this.arenaDraftManager.currentStep$$),
			this.mapData((currentStep) => currentStep === DraftSlotType.DRAFT_SLOT_HERO),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
