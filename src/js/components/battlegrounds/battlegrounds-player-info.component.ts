import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BattlegroundsPlayer } from '../../models/battlegrounds/battlegrounds-player';

@Component({
	selector: 'battlegrounds-player-info',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/battlegrounds-player-info.component.scss',
	],
	template: `
		<div class="battlegrounds-player-info">
			<hero-card [hero]="entity"> </hero-card>
			<div class="player-name">{{ _player.name }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPlayerInfoComponent {
	_player: BattlegroundsPlayer;
	entity: Entity;

	@Input() set player(value: BattlegroundsPlayer) {
		this._player = value;
		this.entity = Entity.create({
			cardID: value.cardId,
		} as Entity);
	}
}
