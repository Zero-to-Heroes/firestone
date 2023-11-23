import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { DungeonCrawlOptionType, SceneMode } from '@firestone-hs/reference-data';
import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged } from 'rxjs';
import { SceneService } from '../../services/game/scene.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-ooc-hero-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<duels-ooc-hero-selection
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
			[stage]="stage$ | async"
		></duels-ooc-hero-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.06;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.08 * gameHeight;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	stage$: Observable<DuelsStatTypeFilterType>;

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
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.store.listenPrefs$((prefs) => prefs.duelsShowInfoOnHeroSelection),
			this.store.listen$(([main, prefs]) => main?.duels),
			this.store.listenNativeGameState$((state) => state.isDuelsChoosingHero),
			this.scene.currentScene$$,
		]).pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(([[displayFromPrefs], [duels], [isDuelsChoosingHero], currentScene]) => {
				return (
					displayFromPrefs &&
					currentScene === SceneMode.PVP_DUNGEON_RUN &&
					(isDuelsChoosingHero ||
						duels.currentOption === DungeonCrawlOptionType.HERO_POWER ||
						duels.currentOption === DungeonCrawlOptionType.TREASURE_SATCHEL)
				);
			}),
			this.handleReposition(),
		);

		this.stage$ = combineLatest([
			this.store.listen$(([main, prefs]) => main?.duels),
			this.store.listenNativeGameState$((state) => state.isDuelsChoosingHero),
		]).pipe(
			this.mapData(([[duels], [isDuelsChoosingHero]]) =>
				isDuelsChoosingHero
					? 'hero'
					: duels?.currentOption === DungeonCrawlOptionType.HERO_POWER
					? 'hero-power'
					: duels?.currentOption === DungeonCrawlOptionType.TREASURE_SATCHEL
					? 'signature-treasure'
					: null,
			),
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
		this.windowWidth = gameHeight * 1.25; //201 1311
		this.windowHeight = gameHeight * 0.84;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
