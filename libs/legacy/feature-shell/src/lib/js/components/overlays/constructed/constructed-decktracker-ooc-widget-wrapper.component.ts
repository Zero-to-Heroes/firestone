import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { AbstractWidgetWrapperComponent } from '@firestone/app/view';
import { SceneService } from '@firestone/memory';
import { DeckParserFacadeService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	IAdsService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, shareReplay, takeUntil, tap } from 'rxjs';

@Component({
	standalone: false,
	selector: 'constructed-decktracker-ooc-widget-wrapper',
	styleUrls: [
		'../../../../css/component/overlays/foreground-widget.component.scss',
		// '../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
		'./constructed-decktracker-ooc-widget-wrapper.component.scss',
	],
	template: `
		<!-- TODO: make the basic version free, and add limited uses for the advanced one -->
		<!-- Maybe add a toggle on the widget itself, and use that to count the free uses?  -->
		<!-- Could maybe be free for one full day per week? Would be easier to manage that way -->
		<div
			class="widget"
			*ngIf="{ premium: hasPremium$ | async } as value"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
			[ngClass]="{ premium: value.premium }"
		>
			<div class="scalable container">
				<ng-container *ngIf="(showWidgetListOnly$ | async) || (showWidgetExtended$ | async)">
					<div class="title-bar">
						<button
							class="toggle-button"
							(click)="toggleMode(value.premium)"
							inlineSVG="assets/svg/restore.svg"
							[helpTooltip]="toggleButtonTooltip$ | async"
						></button>
						<control-close
							[eventProvider]="closeHandler"
							[helpTooltip]="'decktracker.overlay.lobby.close-button-tooltip' | fsTranslate"
						></control-close>
					</div>
					<constructed-decktracker-ooc *ngIf="showWidgetListOnly$ | async"></constructed-decktracker-ooc>
					<constructed-decktracker-extended-ooc
						*ngIf="showWidgetExtended$ | async"
					></constructed-decktracker-extended-ooc>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDecktrackerOocWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.updatePosition(left, top);
	protected positionExtractor = async () => {
		const prefs = await this.prefs.getPreferences();
		return prefs.constructedOocTrackerPosition;
	};
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -200,
		right: -200,
		top: -200,
		bottom: -800,
	};

	showWidgetListOnly$: Observable<boolean>;
	showWidgetExtended$: Observable<boolean>;
	hasPremium$: Observable<boolean>;
	toggleButtonTooltip$: Observable<string>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly deck: DeckParserFacadeService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr, ow, el, prefs, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.deck, this.ads);

		this.hasPremium$ = this.ads.enablePremiumFeatures$$.pipe(this.mapData((premium) => premium));
		this.toggleButtonTooltip$ = this.ads.enablePremiumFeatures$$.pipe(
			this.mapData((premium) =>
				premium
					? this.i18n.translateString('decktracker.overlay.lobby.toggle-button-tooltip')
					: this.i18n.translateString('decktracker.overlay.lobby.toggle-button-locked-tooltip'),
			),
		);

		const canShowWidget$ = combineLatest([this.scene.currentScene$$, this.deck.currentDeck$$]).pipe(
			tap((info) => console.debug('[debug] constructed-decktracker-ooc-widget-wrapper canShowWidget$ 1', info)),
			this.mapData(([currentScene, deck]) => {
				const result =
					[SceneMode.TOURNAMENT, SceneMode.FRIENDLY].includes(currentScene) && deck?.deckstring?.length > 0;
				return result;
			}),
			tap((info) => console.debug('[debug] constructed-decktracker-ooc-widget-wrapper canShowWidget$ 2', info)),
		);

		this.showWidgetListOnly$ = combineLatest([
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({ ooc: prefs.constructedShowOocTracker, displayList: !getValue(prefs) })),
			),
			canShowWidget$,
			this.ads.enablePremiumFeatures$$,
		]).pipe(
			tap((info) =>
				console.debug('[debug] constructed-decktracker-ooc-widget-wrapper showWidgetListOnly$ 1', info),
			),
			this.mapData(
				([{ ooc, displayList }, canShowWidget, premium]) => canShowWidget && ooc && (displayList || !premium),
			),
			shareReplay(1),
			this.handleReposition(),
		);
		this.showWidgetExtended$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedShowOocTracker && getValue(prefs))),
			canShowWidget$,
			this.ads.enablePremiumFeatures$$,
		]).pipe(
			tap((info) =>
				console.debug('[debug] constructed-decktracker-ooc-widget-wrapper showWidgetExtended$ 1', info),
			),
			this.mapData(([displayFromPrefs, canShowWidget, premium]) => canShowWidget && premium && displayFromPrefs),
			shareReplay(1),
			this.handleReposition(),
		);

		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedOocTrackerScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-scale', newScale);
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	closeHandler = async () => {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedShowOocTracker: false,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	async toggleMode(hasPremium: boolean) {
		if (!hasPremium) {
			this.ads.goToPremium();
			return;
		}

		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedShowOocTrackerExtended: !getValue(prefs),
		};
		await this.prefs.savePreferences(newPrefs);
	}

	private async updatePosition(left: number, top: number) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			constructedOocTrackerPosition: { left, top },
		};
		await this.prefs.savePreferences(newPrefs);
	}
}

const getValue = (prefs: Preferences) => prefs.constructedShowOocTrackerExtended;
