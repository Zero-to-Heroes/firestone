import { GameEvent } from '../../../models/game-event';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../models/mercenaries/mercenaries-battle-state';
import { getHeroRole } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';
import { GameTag, TagRole } from '@firestone-hs/reference-data';

export class MercenariesTurnStartParser implements MercenariesParser {
	public eventType = () => GameEvent.TURN_START;

	public applies = (battleState: MercenariesBattleState) => !!battleState;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
	): Promise<MercenariesBattleState> {
	
		if(event.additionalData?.playerBoard && event.additionalData?.playerLettuceAbilities){
			var newPlayerTeam: MercenariesBattleTeam = battleState.playerTeam;

			for (var merc of event.additionalData?.playerBoard) {
				newPlayerTeam = newPlayerTeam.updateMercenary(merc.entityId, 
					{
						cardId: merc.cardId, 
						role: getHeroRole(TagRole[merc?.tags?.find((tag) => tag.Name==GameTag.LETTUCE_ROLE)?.Value]), 
					});
			}

			for (var ability of event.additionalData?.playerLettuceAbilities) {
				newPlayerTeam = newPlayerTeam.updateAbility(ability.entityId,  
					{
						cardId: ability.cardId,
						speed: ability.tags?.find((tag) => tag.Name==GameTag.COST)?.Value,
						cooldownLeft: ability.tags?.find((tag) => tag.Name==GameTag.LETTUCE_CURRENT_COOLDOWN)?.Value,
					}
				)
			}
		}	
		else {
			console.warn('[merc-game-state-update] player info not provided', event);
		}

		if(event.additionalData?.opponentBoard && event.additionalData?.opponentLettuceAbilities){
			var newOpponentTeam: MercenariesBattleTeam = battleState.opponentTeam;

			for (var merc of event.additionalData?.opponentBoard) {
				newOpponentTeam = newOpponentTeam.updateMercenary(merc.entityId,
					{
						cardId: merc.cardId, 
						role: getHeroRole(TagRole[merc?.tags?.find((tag) => tag.Name==GameTag.LETTUCE_ROLE)?.Value]), 
					});
			}
			for (var ability of event.additionalData?.opponentLettuceAbilities) {
				newOpponentTeam = newOpponentTeam.updateAbility(ability.entityId,  
					{
						cardId: ability.cardId,
						speed: ability.tags?.find((tag) => tag.Name==GameTag.COST)?.Value,
						cooldownLeft: ability.tags?.find((tag) => tag.Name==GameTag.LETTUCE_CURRENT_COOLDOWN)?.Value,
					}
				)
			}
		}
		else {
			console.warn('[merc-game-state-update] opponent info not provided', event);
		}

		return battleState.update({
			playerTeam: newPlayerTeam,
			opponentTeam: newOpponentTeam,
			currentTurn: event.additionalData.turnNumber,
			actionQueue: [],
		} as MercenariesBattleState);
	}
}
