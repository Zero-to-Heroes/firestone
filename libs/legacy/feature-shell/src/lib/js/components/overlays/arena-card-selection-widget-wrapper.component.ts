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
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdService } from '../../services/ad.service';
import { ArenaDraftManagerService } from '../../services/arena/arena-draft-manager.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'arena-card-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: ` <arena-card-selection class="widget" *ngIf="showWidget$ | async"></arena-card-selection> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSelectionWidgetWrapperComponent
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
		private readonly ads: AdService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();
		await this.prefs.isReady();
		await this.arenaDraftManager.isReady();

		this.showWidget$ = combineLatest([
			// this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaShowCardSelectionOverlay)),
			this.arenaDraftManager.currentStep$$,
			this.scene.currentScene$$,
		]).pipe(
			this.mapData(([currentStep, currentScene]) => {
				return (
					// displayFromPrefs &&
					currentStep === DraftSlotType.DRAFT_SLOT_CARD && currentScene === SceneMode.DRAFT
				);
			}),
			this.handleReposition(),
		);

		// TODO: only do this when user is not premium?
		combineLatest([this.ads.enablePremiumFeatures$$, this.showWidget$])
			.pipe(
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				takeUntil(this.destroyed$),
			)
			.subscribe(([premium, showWidget]) => {
				// Integration with HearthArena
				if (showWidget && !premium) {
					this.ow.setWindowBehindHearthArena();
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
