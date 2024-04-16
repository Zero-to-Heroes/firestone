import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BgsCardTooltipComponent } from '../bgs-card-tooltip.component';
import { BattleRecapPlayer } from './bgs-battle-recap-player.component';

@Component({
	selector: 'bgs-battle-recap',
	styleUrls: [`./bgs-battle-recap.component.scss`],
	template: `
		<div
			class="bgs-battle-recap"
			[ngClass]="{ selectable: selectable, duos: !!playerTeammate || !!opponentTeammate }"
		>
			<div class="turn-label" *ngIf="turnNumber">
				<div
					class="turn"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
				<div class="result {{ result }}" *ngIf="result">{{ i18nResult }}</div>
			</div>
			<div class="battle-content">
				<div class="team">
					<bgs-battle-recap-player [player]="player"></bgs-battle-recap-player>
					<bgs-battle-recap-player *ngIf="playerTeammate" [player]="playerTeammate"></bgs-battle-recap-player>
				</div>
				<bgs-battle-status class="results" [showReplayLink]="true" [nextBattle]="battle"></bgs-battle-status>
				<div class="team">
					<bgs-battle-recap-player [player]="opponent"></bgs-battle-recap-player>
					<bgs-battle-recap-player
						*ngIf="opponentTeammate"
						[player]="opponentTeammate"
					></bgs-battle-recap-player>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleRecapComponent {
	componentType: ComponentType<any> = BgsCardTooltipComponent;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		if (!value) {
			return;
		}
		console.debug('setting faceOff', value);
		this.turnNumber = value.turn;
		this.result = value.result;
		this.i18nResult = value.result
			? this.i18n.translateString(`battlegrounds.battle.result.${value.result}`)
			: undefined;

		this.player = {
			heroCardId: value.playerCardId,
			health: value.playerHpLeft ?? value.battleInfo?.playerBoard?.player?.hpLeft,
			tavernTier: value.playerTavern ?? value.battleInfo?.playerBoard?.player?.tavernTier,
			board: value.battleInfo?.playerBoard,
		};
		this.opponent = {
			heroCardId: value.opponentCardId,
			health: value.opponentHpLeft ?? value.battleInfo?.opponentBoard?.player?.hpLeft,
			tavernTier: value.opponentTavern ?? value.battleInfo?.opponentBoard?.player?.tavernTier,
			board: value.battleInfo?.opponentBoard,
		};
		this.playerTeammate = !!value.battleInfo?.playerTeammateBoard?.player
			? {
					heroCardId: value.battleInfo.playerTeammateBoard.player?.cardId,
					health: value.battleInfo.playerTeammateBoard.player?.hpLeft,
					tavernTier: value.battleInfo.playerTeammateBoard.player?.tavernTier,
					board: value.battleInfo.playerTeammateBoard,
			  }
			: null;
		this.opponentTeammate = !!value.battleInfo?.opponentTeammateBoard?.player
			? {
					heroCardId: value.battleInfo.opponentTeammateBoard.player?.cardId,
					health: value.battleInfo.opponentTeammateBoard.player?.hpLeft,
					tavernTier: value.battleInfo.opponentTeammateBoard.player?.tavernTier,
					board: value.battleInfo.opponentTeammateBoard,
			  }
			: null;
		console.debug('set sides', this.player, this.opponent, this.playerTeammate, this.opponentTeammate);

		this.battle = value;

		this.selectable = true; // !!value.battleInfo;
	}

	turnNumber: number;
	result: string;
	i18nResult: string;
	selectable: boolean;
	player: BattleRecapPlayer;
	playerTeammate: BattleRecapPlayer;
	opponent: BattleRecapPlayer;
	opponentTeammate: BattleRecapPlayer;
	battle: BgsFaceOffWithSimulation;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	trackByEntityFn(index: number, entity: Entity) {
		return entity.id;
	}
}
