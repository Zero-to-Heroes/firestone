import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'bgs-overlay-hero-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/reset-styles.scss`,
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
	],
	template: `
		<div class="battlegrounds-theme bgs-hero-overview-tooltip scalable">
			<bgs-opponent-overview-big
				*ngIf="scale"
				[opponent]="_opponent"
				[enableSimulation]="false"
				[maxBoardHeight]="-1"
				[currentTurn]="currentTurn"
				[tavernTitle]="'battlegrounds.in-game.opponents.tavern-latest-upgrade-title' | owTranslate"
				[showTavernsIfEmpty]="false"
				[showLastOpponentIcon]="isLastOpponent"
			></bgs-opponent-overview-big>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOverlayHeroOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set config(value: {
		player: BgsPlayer;
		currentTurn: number;
		isLastOpponent: boolean;
		additionalClasses: string;
	}) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.isLastOpponent = value.isLastOpponent;
		this.componentClass = value.additionalClasses;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostBinding('class') get hostClasses() {
		return `${this.componentClass}`;
	}

	componentClass: string;
	_opponent: BgsPlayer;
	currentTurn: number;
	isLastOpponent: boolean;
	scale: number;

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.store
			.listenPrefs$((prefs) => prefs.bgsOpponentBoardScale)
			.pipe(this.mapData(([pref]) => pref, null, 0))
			.subscribe((scale) => {
				try {
					// Use this trick to avoid having the component flicker when appearing
					this.scale = scale / 100;
					const element = this.el.nativeElement.querySelector('.scalable');
					this.renderer.setStyle(element, 'transform', `scale(${this.scale})`);
				} catch (e) {
					// Do nothing
				}
			});
		this.store
			.listenPrefs$((prefs) => prefs.bgsOpponentOverlayAtTop)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((pref) => {
				try {
					const element = this.el.nativeElement.querySelector('.scalable');
					this.renderer.setStyle(element, 'transform-origin', pref ? 'top left' : 'bottom left');
					this.renderer.removeClass(element, 'bottom');
					if (!pref) {
						this.renderer.addClass(element, 'bottom');
					}
				} catch (e) {
					// Do nothing
				}
			});
	}

	async ngAfterContentInit() {
		// This method is not called, because we create teh component manually
	}
}
