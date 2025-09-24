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
import { ArenaDraftManagerService } from '@firestone/arena/common';
import { SceneService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, mergeMap, of, takeUntil } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'arena-decktracker-ooc-widget-wrapper',
	styleUrls: [
		'../../../css/component/overlays/foreground-widget.component.scss',
		'../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss',
		'./arena-decktracker-ooc-widget-wrapper.component.scss',
	],
	template: `
		<arena-decktracker-ooc
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></arena-decktracker-ooc>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDecktrackerOocWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth - 250;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 10;
	protected positionUpdater = (left: number, top: number) => this.updatePosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.arenaOocTrackerPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
		private readonly draftManager: ArenaDraftManagerService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.scene, this.prefs, this.draftManager);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaShowOocTracker)),
			this.scene.currentScene$$,
		]).pipe(
			mergeMap(([displayFromPrefs, currentScene]) => {
				if (!displayFromPrefs || currentScene !== SceneMode.DRAFT) {
					return of(false);
				}
				return combineLatest([this.draftManager.cardOptions$$, this.draftManager.currentDeck$$]).pipe(
					this.mapData(([cardOptions, deck]) => cardOptions?.length > 0 || deck?.DeckList?.length > 0),
				);
			}),
			takeUntil(this.destroyed$),
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
			arenaOocTrackerPosition: { left, top },
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
