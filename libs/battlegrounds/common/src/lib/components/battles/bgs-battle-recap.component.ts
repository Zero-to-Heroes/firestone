/* eslint-disable no-mixed-spaces-and-tabs */
import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsCardTooltipComponent } from '@firestone/battlegrounds/core';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattleRecapPlayer } from './bgs-battle-recap-player.component';

@Component({
	selector: 'bgs-battle-recap',
	styleUrls: [`./bgs-battle-recap.component.scss`],
	template: `
		<div
			class="bgs-battle-recap"
			[ngClass]="{ selectable: selectable, duos: !!playerTeammate || !!opponentTeammate }"
			[attr.data-id]="battle?.id ?? 'unknown-id'"
		>
			<div class="turn-label" *ngIf="turnNumber">
				<div
					class="turn"
					[fsTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
				<div class="result {{ result }}" *ngIf="result">{{ i18nResult }}</div>
			</div>
			<div class="battle-content">
				<div class="background" [helpTooltip]="'battlegrounds.battle.import-tooltip' | fsTranslate"></div>
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
		console.debug('setting faceoff', value);
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
			board: playerBattleInfo ?? null,
		};
		const opponentBattleInfo = value.battleInfo?.opponentBoard;
		this.opponent = {
			heroCardId: opponentBattleInfo?.player?.cardId ?? value.opponentCardId,
			health: opponentBattleInfo?.player?.hpLeft ?? value.opponentHpLeft,
			tavernTier: opponentBattleInfo?.player?.tavernTier ?? value.opponentTavern,
			board: opponentBattleInfo ?? null,
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

		this.battle = value;
	}

	turnNumber: number;
	result: string;
	i18nResult: string | undefined;
	player: BattleRecapPlayer;
	playerTeammate: BattleRecapPlayer | null;
	opponent: BattleRecapPlayer;
	opponentTeammate: BattleRecapPlayer | null;
	battle: BgsFaceOffWithSimulation;

	@Input() selectable = true;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	trackByEntityFn(index: number, entity: Entity) {
		return entity.id;
	}
}
