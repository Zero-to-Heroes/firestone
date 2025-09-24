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
import { AbstractWidgetWrapperComponent } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, mergeMap, of, takeUntil } from 'rxjs';
import { ArenaDraftManagerService } from '../../services/arena-draft-manager.service';

@Component({
	standalone: false,
	selector: 'arena-package-card-selection-widget-wrapper',
	styleUrls: ['./arena-package-card-selection-widget-wrapper.component.scss'],
	template: `
		<arena-package-card-selection class="widget" *ngIf="showWidget$ | async"></arena-package-card-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaPackageCardSelectionWidgetWrapperComponent
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
		protected override readonly ow: OverwolfService,
		protected override readonly el: ElementRef,
		protected override readonly prefs: PreferencesService,
		protected override readonly renderer: Renderer2,
		protected override readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly arenaDraftManager: ArenaDraftManagerService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.arenaDraftManager);

		this.showWidget$ = this.scene.currentScene$$.pipe(
			mergeMap((scene) => {
				if (scene !== SceneMode.DRAFT) {
					return of(false);
				}
				return this.arenaDraftManager.cardPackageOptions$$.pipe(
					this.mapData((cardPackageOptions) => !!cardPackageOptions?.length),
				);
			}),
			takeUntil(this.destroyed$),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
