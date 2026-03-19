import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardClass, DraftSlotType, SceneMode } from '@firestone-hs/reference-data';
import {
	ArenaClassStatsService,
	ArenaDraftManagerService,
	ArenaHeroOption,
	ArenaMetaHeroStrategiesService,
} from '@firestone/arena/common';
import { buildArenaClassInfoTiers } from '@firestone/arena/view';
import { SceneService } from '@firestone/memory';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import {
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, mergeMap, of, shareReplay, switchMap, takeUntil } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'arena-hero-selected-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/background-widget.component.scss',
		'./arena-hero-selected-widget-wrapper.component.scss',
	],
	template: ` <arena-hero-option class="widget" *ngIf="showWidget$ | async" [hero]="option$ | async">
	</arena-hero-option>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHeroSelectedWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0.27 * gameHeight;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.9 * gameHeight;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	option$: Observable<ArenaHeroOption | null>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly arenaDraftManager: ArenaDraftManagerService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly arenaMetaHeroStrategies: ArenaMetaHeroStrategiesService,
		private readonly patches: PatchesConfigService,
		private readonly i18n: ILocalizationService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.arenaDraftManager);

		const tiers$ = combineLatest([
			this.arenaClassStats.classStats$$,
			this.arenaMetaHeroStrategies.strategies$$,
			this.patches.config$$,
		]).pipe(
			this.mapData(([stats, strategies, config]) => {
				return buildArenaClassInfoTiers(stats?.stats, strategies?.heroes, null, config, this.i18n);
			}),
			shareReplay(1),
			this.mapData((tiers) => tiers),
		);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaShowHeroSelectionOverlay)),
			this.scene.currentScene$$,
		]).pipe(
			mergeMap(([displayFromPrefs, currentScene]) => {
				if (!displayFromPrefs || currentScene !== SceneMode.DRAFT) {
					return of(false);
				}
				return this.arenaDraftManager.currentStep$$.pipe(
					this.mapData((currentStep) => currentStep === DraftSlotType.DRAFT_SLOT_CARD),
				);
			}),
			takeUntil(this.destroyed$),
			this.handleReposition(),
		);

		this.option$ = this.showWidget$.pipe(
			switchMap((show) => {
				if (!show) {
					return of(null);
				}
				return combineLatest([this.arenaDraftManager.currentDeck$$, tiers$]).pipe(
					this.mapData(([deck, tiers]) => {
						let heroClass = deck.HeroClass ? CardClass[deck.HeroClass].toLowerCase() : null;
						if (!heroClass) {
							const heroCard = this.allCards.getCard(deck.HeroCardId);
							heroClass = heroCard?.classes?.[0]?.toLowerCase() ?? 'neutral';
						}

						const classStat = tiers?.flatMap((tier) => tier.items).find((i) => i.playerClass === heroClass);
						const tier = !!classStat ? tiers?.find((tier) => tier.items.includes(classStat)) : null;
						const result: ArenaHeroOption | null = {
							cardId: deck.HeroCardId,
							winrate: classStat?.winrate,
							tier: tier?.id,
							tip: classStat?.tip,
						};
						return result;
					}),
				);
			}),
			takeUntil(this.destroyed$),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
