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
import { BgsPlayer } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'bgs-overlay-hero-overview',
	styleUrls: [
		// '../../../../css/themes/battlegrounds-theme.scss',
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
				[buddiesEnabled]="buddiesEnabled"
				[showQuestRewardsIfEmpty]="questsEnabled"
			></bgs-opponent-overview-big>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOverlayHeroOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set config(value: {
		player: BgsPlayer;
		config: {
			hasBuddies: boolean;
			hasQuests: boolean;
		};
		currentTurn: number;
		isLastOpponent: boolean;
		additionalClasses: string;
	}) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.isLastOpponent = value.isLastOpponent;
		this.componentClass = value.additionalClasses;
		this.buddiesEnabled = value.config?.hasBuddies;
		this.questsEnabled = value.config?.hasQuests;
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

	buddiesEnabled: boolean;
	questsEnabled: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.init();
	}

	private async init() {
		await this.prefs.isReady();

		// Maybe remove this as well?
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsOpponentOverlayAtTop)).subscribe((pref) => {
			try {
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform-origin', pref ? 'top left' : 'bottom left');
					this.renderer.removeClass(element, 'bottom');
					if (!pref) {
						this.renderer.addClass(element, 'bottom');
					}
				}
			} catch (e) {
				// Do nothing
			}
		});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterContentInit() {
		// This method is not called, because we create teh component manually
	}
}
