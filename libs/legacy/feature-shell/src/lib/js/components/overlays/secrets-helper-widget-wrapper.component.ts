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
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { SceneService } from '../../services/game/scene.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'secrets-helper-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<secrets-helper
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
		></secrets-helper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameWidth / 2;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.05;
	protected positionUpdater = (left: number, top: number) => this.prefs.updateSecretsHelperPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.secretsHelperPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;

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
			this.scene.currentScene$$,
			this.store.listen$(
				// Show from prefs
				([main, nav, pref]) => pref.secretsHelper,
			),
			this.store.listenDeckState$(
				(deckState) => deckState?.gameStarted,
				(deckState) => deckState?.gameEnded,
				(deckState) => deckState?.isBattlegrounds(),
				(deckState) => deckState?.isMercenaries(),
				(deckState) => !!deckState?.opponentDeck?.secrets?.length,
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [gameStarted, gameEnded, isBgs, isMercs, hasSecrets]]) => {
				if (!gameStarted || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				return !gameEnded && hasSecrets;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
