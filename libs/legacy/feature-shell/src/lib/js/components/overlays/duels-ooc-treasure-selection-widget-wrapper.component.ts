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
import { PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-ooc-treasure-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<duels-ooc-treasure-selection
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></duels-ooc-treasure-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatTreasureSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.1;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.18 * gameHeight;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

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
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.duelsHighlightTreasureSynergies)),
			this.store.listen$(([main, prefs]) => main?.duels),
			this.scene.currentScene$$,
		]).pipe(
			this.mapData(([displayFromPrefs, [duels], currentScene]) => {
				return (
					displayFromPrefs &&
					currentScene === SceneMode.PVP_DUNGEON_RUN &&
					!!duels.treasureSelection?.treasures?.length
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
