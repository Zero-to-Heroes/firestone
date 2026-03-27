import { Injectable } from '@angular/core';
import { CardType, GameTag, Step, Zone } from '@firestone-hs/reference-data';
import { Action } from '../../models/action/action';
import { Game } from '../../models/game/game';
import { GameEntity } from '../../models/game/game-entity';
import { Turn } from '../../models/game/turn';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class MulliganParserService {
	constructor(private allCards: AllCardsService) {}

	public affectMulligan(game: Game): Game {
		let turns = game.turns;
		const mulliganTurn = game.turns.get(0);
		const enrichedMulligan = this.enrichTurn(mulliganTurn);
		turns = turns.set(0, enrichedMulligan);
		return Game.createGame(game, { turns } as Game);
	}

	private enrichTurn(turn: Turn): Turn {
		const newActions = [];
		for (let i = 0; i < turn.actions.length; i++) {
			const previousAction = i === 0 ? null : newActions[i - 1];
			const newAction = this.enrichAction(turn.actions[i], previousAction);
			newActions.push(newAction);
		}
		return turn.update({ actions: newActions as readonly Action[] } as Turn);
	}

	private enrichAction(action: Action, previousAction: Action): Action {
		// // console.log(
		// 	'enriching action',
		// 	action,
		// 	action.entities.toJS(),
		// 	action.entities.get(73).tags.toJS(),
		// 	action.entities.get(74).tags.toJS(),
		// );
		const mulliganEntities = action.entities
			.valueSeq()
			.toArray()
			.filter(entity => entity.getTag(GameTag.ZONE) === Zone.HAND)
			.filter(entity => entity.cardID !== 'GAME_005') // Don't show the coin yet
			.sort((a, b) => a.getTag(GameTag.ZONE_POSITION) - b.getTag(GameTag.ZONE_POSITION));
		// // console.log('mulligan entities', mulliganEntities, mulliganEntities.map(entity => entity.tags.toJS()));
		// Hero selection phase
		let isHeroSelection = false;
		if (mulliganEntities.length > 0 && mulliganEntities[0].getCardType() === CardType.HERO) {
			// // console.log('hero selection');
			isHeroSelection = true;
		}

		let isMulligan = !isHeroSelection && mulliganEntities.length > 0;
		// // console.log('isMulligan?', isMulligan, mulliganEntities);
		// // console.log('previous entities', previousAction && previousAction.entities.toJS());
		if (action.activeSpell) {
			isMulligan = false;
		} else if (
			previousAction &&
			previousAction.entities.find(entity => entity instanceof GameEntity).getTag(GameTag.STEP) ===
				Step.BEGIN_MULLIGAN
		) {
			isMulligan = previousAction.isMulligan;
		}
		return action.updateAction({ isMulligan, isHeroSelection } as Action);
	}
}
