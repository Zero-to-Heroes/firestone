import { ComponentType } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { BgsOverlayHeroOverviewComponent } from './bgs-overlay-hero-overview.component';

@Component({
	selector: 'bgs-leaderboard-empty-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-leaderboard-empty-card.component.scss',
	],
	template: `
		<div class="card">
			<div
				class="mouse-leave-container"
				componentTooltip
				[componentType]="componentType"
				[componentInput]="_bgsPlayer"
				[componentTooltipPosition]="position"
			>
				<!-- transparent image with 1:1 intrinsic aspect ratio -->
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
				<div
					class="last-opponent-icon"
					*ngIf="isLastOpponent && showLastOpponentIcon"
					helpTooltip="Was last round's opponent"
					inlineSVG="assets/svg/last_opponent.svg"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardEmptyCardComponent implements AfterViewInit, OnDestroy {
	componentType: ComponentType<any> = BgsOverlayHeroOverviewComponent;

	@Input() position: 'global-top-center' | 'global-top-left' | 'global-bottom-left' | 'right' = 'global-top-left';

	@Input() set currentTurn(value: number) {
		if (this._currentTurn === value) {
			return;
		}
		this._currentTurn = value;
		this.updateInfo();
	}

	@Input() set lastOpponentCardId(value: string) {
		if (this._lastOpponentCardId === value) {
			return;
		}
		this._lastOpponentCardId = value;
		this.updateInfo();
	}

	@Input() set bgsPlayer(value: BgsPlayer) {
		if (this._previousPlayer === value) {
			return;
		}
		this._previousPlayer = value;
		this.updateInfo();
	}

	@Input() showLastOpponentIcon: boolean;

	componentClass: string;
	_bgsPlayer: {
		player: BgsPlayer;
		currentTurn: number;
		isLastOpponent: boolean;
		additionalClasses: string;
	};

	_previousPlayer: BgsPlayer;
	_currentTurn: number;
	_lastOpponentCardId: string;
	isLastOpponent: boolean;

	private preferencesSubscription: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		await this.handleDisplayPreferences();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		this.position = preferences.bgsOpponentOverlayAtTop ? 'global-top-left' : 'global-bottom-left';
		this.componentClass = preferences.bgsOpponentOverlayAtTop ? null : 'bottom';
		this.updateInfo();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		if (!this._previousPlayer) {
			return;
		}

		this.isLastOpponent = this._lastOpponentCardId === this._previousPlayer.getNormalizedHeroCardId();
		this._bgsPlayer = {
			player: BgsPlayer.create({
				cardId: this._previousPlayer.cardId,
				heroPowerCardId: this._previousPlayer.heroPowerCardId,
				initialHealth: this._previousPlayer.initialHealth,
				damageTaken: this._previousPlayer.damageTaken,
				isMainPlayer: this._previousPlayer.isMainPlayer,
				name: this._previousPlayer.name,
				leaderboardPlace: this._previousPlayer.leaderboardPlace,
				tavernUpgradeHistory: this._previousPlayer.tavernUpgradeHistory,
				tripleHistory: this._previousPlayer.tripleHistory,
				boardHistory: this._previousPlayer?.boardHistory ?? [],
			} as BgsPlayer),
			currentTurn: this._currentTurn,
			isLastOpponent: this.isLastOpponent,
			additionalClasses: this.componentClass,
		};
	}
}
