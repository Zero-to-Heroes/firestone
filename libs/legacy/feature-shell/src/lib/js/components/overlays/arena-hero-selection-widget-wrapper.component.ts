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
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
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
		await this.scene.isReady();
		await this.prefs.isReady();
		await this.arenaDraftManager.isReady();

		this.showWidget$ = combineLatest([
			this.prefs.preferences$((prefs) => prefs.arenaShowHeroSelectionOverlay),
			this.arenaDraftManager.currentStep$$,
			this.scene.currentScene$$,
		]).pipe(
			this.mapData(([[displayFromPrefs], currentStep, currentScene]) => {
				return (
					displayFromPrefs &&
					currentStep === DraftSlotType.DRAFT_SLOT_HERO &&
					currentScene === SceneMode.DRAFT
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
