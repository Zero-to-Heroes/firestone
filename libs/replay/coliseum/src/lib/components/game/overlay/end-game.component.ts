import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag, PlayState } from '@firestone-hs/reference-data';
import { Entity, PlayerEntity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'end-game',
	styleUrls: ['./end-game.component.scss'],
	template: `
		<div class="end-game {{ statusClass }}">
			<img src="{{ heroImage }}" class="hero-image" />
			<img src="{{ frame }}" class="status-frame" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndGameComponent {
	_entities: Map<number, Entity>;
	_playerId: number;
	_status: PlayState | null;
	heroImage: string;
	frame: string;
	statusClass: string;

	@Input() set entities(entities: Map<number, Entity>) {
		console.debug('[end-game] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateHeroImage();
	}

	@Input() set playerId(playerId: number) {
		console.debug('[end-game] setting playerId', playerId);
		this._playerId = playerId;
		this.updateHeroImage();
	}

	@Input() set status(value: number | null) {
		console.debug('[end-game] setting status', value);
		this._status = value;
		this.updateFrame();
	}

	private updateFrame() {
		if (!this._status) {
			console.debug('[end-game] entities not initialized yet');
			return;
		}
		this.statusClass = this._status === PlayState.WON ? 'won' : 'lost';
		const imageName = this._status === PlayState.WON ? 'victory_screen' : 'loss_screen';
		this.frame = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/${imageName}.png`;
	}

	private updateHeroImage() {
		if (!this._entities || !this._playerId) {
			console.debug('[end-game] entities not initialized yet');
			return;
		}
		const player = this._entities
			.valueSeq()
			.filter((entity) => entity instanceof PlayerEntity)
			.map((entity) => entity as PlayerEntity)
			.filter((entity) => entity.playerId === this._playerId)
			.first();
		const heroEntityId = player?.getTag(GameTag.HERO_ENTITY);
		const hero = this._entities.get(heroEntityId ?? 0);
		this.heroImage = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${hero?.cardID}.jpg`;
	}
}
