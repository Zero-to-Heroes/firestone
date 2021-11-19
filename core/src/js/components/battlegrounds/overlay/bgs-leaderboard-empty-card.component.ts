import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
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
export class BgsLeaderboardEmptyCardComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	componentType: ComponentType<any> = BgsOverlayHeroOverviewComponent;

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
		console.debug('updating bgsPlayer', value, this._previousPlayer);
		this._previousPlayer = value;
		this.updateInfo();
	}

	@Input() showLastOpponentIcon: boolean;

	position: 'global-top-center' | 'global-top-left' | 'global-bottom-left' | 'right' = 'global-top-left';

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

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.listenForBasicPref$((prefs) => prefs.bgsOpponentOverlayAtTop).subscribe((value) => {
			this.position = value ? 'global-top-left' : 'global-bottom-left';
			this.componentClass = value ? null : 'bottom';
			this.updateInfo();
		});
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
