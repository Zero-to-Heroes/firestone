import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsOverlayHeroOverviewComponent } from './bgs-overlay-hero-overview.component';

@Component({
	selector: 'bgs-leaderboard-empty-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-leaderboard-empty-card.component.scss',
	],
	template: `
		<div
			class="card"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="_bgsPlayer"
			[componentTooltipPosition]="position"
		>
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardEmptyCardComponent {
	componentType: ComponentType<any> = BgsOverlayHeroOverviewComponent;

	@Input() position: 'global-top-center' | 'global-top-left' | 'right' = 'right';

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

	_bgsPlayer: {
		player: BgsPlayer;
		currentTurn: number;
		isLastOpponent: boolean;
	};

	_previousPlayer: BgsPlayer;
	_currentTurn: number;
	_lastOpponentCardId: string;

	private updateInfo() {
		if (!this._previousPlayer) {
			return;
		}

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
			isLastOpponent: this._lastOpponentCardId === this._previousPlayer.getNormalizedHeroCardId(),
		};
	}
}
