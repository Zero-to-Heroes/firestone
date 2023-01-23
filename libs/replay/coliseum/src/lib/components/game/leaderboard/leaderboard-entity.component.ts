import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'leaderboard-entity',
	styleUrls: ['./leaderboard-entity.component.scss'],
	template: `
		<div class="leaderboard-entity">
			<img class="portrait" [src]="image" />
			<div class="death-overlay" *ngIf="isDead"></div>
			<div class="health-bar" *ngIf="!isDead">
				<div class="health" [style.width.%]="percentageHealth"></div>
			</div>
			<img class="frame" [src]="leaderboardFrame" />
			<img
				class="skull"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/skull.png"
				*ngIf="isDead"
			/>
			<tavern-level-icon [level]="tavernLevel"></tavern-level-icon>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardEntityComponent {
	image: string;
	leaderboardFrame: string;
	_entity: Entity;
	_isMainPlayer: boolean;
	isDead: boolean;
	percentageHealth: number;
	tavernLevel: number;

	@Input() set isMainPlayer(value: boolean) {
		this._isMainPlayer = value;
		this.updateEntity();
	}

	@Input() set entity(value: Entity) {
		this._entity = value;
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardID}.jpg`;
		this.updateEntity();
	}

	private updateEntity() {
		if (!this._entity) {
			return;
		}
		const frame = this._isMainPlayer ? 'leaderboard_frame_player' : 'leaderboard_frame_opponent';
		this.leaderboardFrame = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/${frame}.png`;
		const maxHealth = this._entity.getTag(GameTag.HEALTH);
		const damage = this._entity.getTag(GameTag.DAMAGE) || 0;
		this.isDead = maxHealth - damage <= 0;
		this.percentageHealth = (100 * (maxHealth - damage)) / maxHealth;
		this.tavernLevel = this._entity.getTag(GameTag.PLAYER_TECH_LEVEL) || 1;
	}
}
