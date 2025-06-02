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
import { ArenaDraftManagerService } from '@firestone/arena/common';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, mergeMap, of, takeUntil, tap } from 'rxjs';
import { AdService } from '../../services/ad.service';
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly arenaDraftManager: ArenaDraftManagerService,
		private readonly ads: AdService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.arenaDraftManager);

		this.showWidget$ = this.scene.currentScene$$.pipe(
			mergeMap((scene) => {
				if (scene !== SceneMode.DRAFT) {
					return of(false);
				}
				return combineLatest([
					this.arenaDraftManager.draftScreenHidden$$,
					this.arenaDraftManager.currentStep$$,
				]).pipe(
					tap((info) => console.debug('[arena-card-selection-widget-wrapper] showing?', info)),
					this.mapData(([hidden, currentStep]) => !hidden && currentStep === DraftSlotType.DRAFT_SLOT_CARD),
				);
			}),
			takeUntil(this.destroyed$),
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
