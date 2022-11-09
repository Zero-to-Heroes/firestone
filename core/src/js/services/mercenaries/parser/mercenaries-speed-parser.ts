import { GameEvent } from '../../../models/game-event';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesSpeedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.COST_CHANGED;

	public applies = (battleState: MercenariesBattleState) => !!battleState;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		console.debug('[merc-speed-parser] changing speed', event);
		if (!localPlayer) {
			console.error('[merc-speed-parser] no local player present', event);
			return battleState;
		}
		if (!cardId) {
			return battleState;
		}

		const ownerEntityId = event.additionalData.abilityOwnerEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const abilityOwner = team.getMercenary(ownerEntityId);
		if (!abilityOwner) {
			console.warn('[merc-speed-parser] missing owner', ownerEntityId);
			return battleState;
		}

		const newMerc = abilityOwner.updateAbility(
			entityId,
			cardId,
			BattleAbility.create({
				cardId: cardId,
				speed: event.additionalData.cost,
			}),
		);

		if (newMerc.abilities.some((a) => !a.cardId)) {
			// This happens when a speed change is applied to all the abilities, including the variations
			// from a base ability (like Archdruid's Rage/Blessing which are variations of Malfurion's
			// Archdruid's Call)
			// In that case, we simply ignore the speed change
			console.debug('created empty ability for speed', abilityOwner, newMerc, event, battleState);
			return battleState;
		}
		console.debug('[merc-speed-parser] newMerc', newMerc);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
