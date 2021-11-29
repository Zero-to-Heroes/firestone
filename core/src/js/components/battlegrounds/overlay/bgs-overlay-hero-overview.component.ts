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
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
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
		<div class="battlegrounds-theme bgs-hero-overview-tooltip">
			<bgs-opponent-overview-big
				[opponent]="_opponent"
				[enableSimulation]="false"
				[maxBoardHeight]="-1"
				[currentTurn]="currentTurn"
				tavernTitle="Latest upgrade"
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

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.store
			.listenPrefs$((prefs) => prefs.bgsOpponentBoardScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				try {
					console.debug('updating scale', scale);
					this.el.nativeElement.style.setProperty('--bgs-opponent-board-scale', scale / 100);
					const newScale = scale / 100;
					const element = this.el.nativeElement.querySelector('.scalable');
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				} catch (e) {
					// Do nothing
				}
			});
	}
}
