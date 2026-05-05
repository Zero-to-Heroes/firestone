import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { MercenariesOutOfCombatFacadeService } from '@firestone/mercenaries/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { GameInfoService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'mercs-treasure-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<mercenaries-out-of-combat-treasure-selection
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></mercenaries-out-of-combat-treasure-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercsTreasureSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.1;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.29 * gameHeight;
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly gameInfoService: GameInfoService,
		private readonly mercenariesOutOfCombatFacade: MercenariesOutOfCombatFacadeService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.mercenariesOutOfCombatFacade);

		this.showWidget$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesHighlightSynergies)),
			this.mercenariesOutOfCombatFacade.store$$.pipe(
				this.mapData((state) => !!state?.treasureSelection?.treasureIds?.length),
			),
		]).pipe(
			this.mapData(([displayFromPrefs, hasTreasures]) => {
				return displayFromPrefs && hasTreasures;
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.gameInfoService.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 1.2;
		this.windowHeight = gameHeight * 0.4;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
