import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsCardTooltipComponent, BgsFaceOffWithSimulation } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { BattleRecapPlayer } from './bgs-battle-recap-player.component';

@Component({
	selector: 'bgs-battle-recap',
	styleUrls: [`./bgs-battle-recap.component.scss`],
	template: `
		<div
			class="bgs-battle-recap"
			[ngClass]="{ selectable: selectable, duos: !!playerTeammate || !!opponentTeammate }"
			[attr.data-id]="battle?.id"
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

		const playerBattleInfo = value.battleInfo?.playerBoard;
		this.player = {
			heroCardId: playerBattleInfo?.player?.cardId ?? value.playerCardId,
			health: playerBattleInfo?.player?.hpLeft ?? value.playerHpLeft,
			tavernTier: playerBattleInfo?.player?.tavernTier ?? value.playerTavern,
			board: playerBattleInfo,
		};
		const opponentBattleInfo = value.battleInfo?.opponentBoard;
		this.opponent = {
			heroCardId: opponentBattleInfo?.player?.cardId ?? value.opponentCardId,
			health: opponentBattleInfo?.player?.hpLeft ?? value.opponentHpLeft,
			tavernTier: opponentBattleInfo?.player?.tavernTier ?? value.opponentTavern,
			board: opponentBattleInfo,
		};
		const playerTeammateBattleInfo = value.battleInfo?.playerTeammateBoard;
		this.playerTeammate = !!playerTeammateBattleInfo?.player
			? {
					heroCardId: playerTeammateBattleInfo.player?.cardId,
					health: playerTeammateBattleInfo.player?.hpLeft,
					tavernTier: playerTeammateBattleInfo.player?.tavernTier,
					board: playerTeammateBattleInfo,
			  }
			: null;
		const opponentTeammateBattleInfo = value.battleInfo?.opponentTeammateBoard;
		this.opponentTeammate = !!opponentTeammateBattleInfo?.player
			? {
					heroCardId: opponentTeammateBattleInfo.player?.cardId,
					health: opponentTeammateBattleInfo.player?.hpLeft,
					tavernTier: opponentTeammateBattleInfo.player?.tavernTier,
					board: opponentTeammateBattleInfo,
			  }
			: null;
		console.debug('set sides', this.player, this.opponent, this.playerTeammate, this.opponentTeammate);

		this.battle = value;
	}

	turnNumber: number;
	result: string;
	i18nResult: string;
	player: BattleRecapPlayer;
	playerTeammate: BattleRecapPlayer;
	opponent: BattleRecapPlayer;
	opponentTeammate: BattleRecapPlayer;
	battle: BgsFaceOffWithSimulation;

	@Input() selectable = true;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	trackByEntityFn(index: number, entity: Entity) {
		return entity.id;
	}
}
