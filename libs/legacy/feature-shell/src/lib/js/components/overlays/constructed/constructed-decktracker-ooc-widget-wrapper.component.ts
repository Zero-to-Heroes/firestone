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
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { DeckParserFacadeService } from '../../../services/decktracker/deck-parser-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'constructed-decktracker-ooc-widget-wrapper',
	styleUrls: [
		'../../../../css/component/overlays/foreground-widget.component.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
	],
	template: `
		<!-- TODO: make the basic version free, and add limited uses for the advanced one -->
		<!-- Maybe add a toggle on the widget itself, and use that to count the free uses?  -->
		<!-- Could maybe be free for one full day per week? Would be easier to manage that way -->
		<constructed-decktracker-ooc
			class="widget"
			*ngIf="showWidgetListOnly$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></constructed-decktracker-ooc>
		<constructed-decktracker-extended-ooc
			class="widget"
			*ngIf="showWidgetExtended$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></constructed-decktracker-extended-ooc>
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
	protected positionExtractor = async (prefs: Preferences) => prefs.constructedOocTrackerPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

	showWidgetListOnly$: Observable<boolean>;
	showWidgetExtended$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly deck: DeckParserFacadeService,
		private readonly ads: AdService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.deck, this.ads);

		const canShowWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.deck.currentDeck$$,
			this.ads.enablePremiumFeatures$$,
		]).pipe(
			this.mapData(([currentScene, deck, premium]) => {
				const result =
					premium &&
					[SceneMode.TOURNAMENT, SceneMode.FRIENDLY].includes(currentScene) &&
					deck?.deckstring?.length > 0;
				return result;
			}),
		);

		this.showWidgetListOnly$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedShowOocTracker && !getValue(prefs))),
			canShowWidget$,
		]).pipe(
			this.mapData(([displayFromPrefs, canShowWidget]) => canShowWidget && displayFromPrefs),
			this.handleReposition(),
		);
		this.showWidgetExtended$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedShowOocTracker && getValue(prefs))),
			canShowWidget$,
		]).pipe(
			this.mapData(([displayFromPrefs, canShowWidget]) => canShowWidget && displayFromPrefs),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
