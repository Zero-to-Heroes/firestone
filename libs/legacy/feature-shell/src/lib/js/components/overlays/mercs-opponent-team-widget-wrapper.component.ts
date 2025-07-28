import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'mercs-opponent-team-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: `
		<mercenaries-opponent-team
			class="widget"
			*ngIf="showWidget$ | async"
			cdkDrag
			[cdkDragDisabled]="!draggable"
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(cdkDragEnded)="dragEnded($event)"
			[tooltipPosition]="tooltipPosition"
		></mercenaries-opponent-team>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsOpponentTeamWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => 0;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 50;
	protected positionUpdater = (left: number, top: number) =>
		this.prefs.updateMercenariesTeamOpponentPosition(left, top);
	protected positionExtractor = async (prefs: Preferences) => prefs.mercenariesOpponentTeamOverlayPosition;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();
	protected isWidgetVisible = () => this.visible;
	protected bounds = {
		left: -100,
		right: -100,
		top: -50,
		bottom: -50,
	};

	private visible: boolean;

	tooltipPosition: CardTooltipPositionType = 'left';

	showWidget$: Observable<boolean>;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesEnableOpponentTeamWidget)),
			this.store.listenMercenaries$(
				([state, prefs]) => state?.opponentClosedManually,
				([state, prefs]) => !!state?.opponentTeam?.mercenaries?.length,
			),
		]).pipe(
			this.mapData(([displayFromPrefs, [playerClosedManually, hasTeamMercs]]) => {
				return displayFromPrefs && !playerClosedManually && hasTeamMercs;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	// TODO: there might be a more elegant solution that doesn't require to override reposition
	protected async reposition(cleanup?: () => void): Promise<{ left: number; top: number }> {
		const newPosition = await super.reposition(cleanup);
		if (!newPosition) {
			return;
		}

		this.tooltipPosition = newPosition.left < 400 ? 'right' : 'left';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return newPosition;
	}
}
