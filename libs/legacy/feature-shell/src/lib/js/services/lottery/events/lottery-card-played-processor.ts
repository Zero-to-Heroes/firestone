import { Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LotteryState } from '../lottery.model';
import { LotteryProcessor } from './_processor';

export class LotteryCardPlayedProcessor implements LotteryProcessor {
	constructor(private readonly allCards: CardsFacadeService) {}

	process(currentState: LotteryState, event: GameEvent): LotteryState {
		if (!currentState.shouldTrack) {
			console.debug('[lottery] not tracking, ignoring event', event);
			return currentState;
		}

		const [cardId, controllerId, localPlayer] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const isSpell = this.allCards.getCard(cardId).type === 'Spell';
		const cardRaces = this.allCards.getCard(cardId).races;

		return currentState.update({
			quilboarsPlayed: this.cardsPlayedForRace(cardRaces, Race.QUILBOAR, currentState.quilboarsPlayed),
			beastsPlayed: this.cardsPlayedForRace(cardRaces, Race.BEAST, currentState.beastsPlayed),
			demonsPlayed: this.cardsPlayedForRace(cardRaces, Race.DEMON, currentState.demonsPlayed),
			dragonsPlayed: this.cardsPlayedForRace(cardRaces, Race.DRAGON, currentState.dragonsPlayed),
			mechsPlayed: this.cardsPlayedForRace(cardRaces, Race.MECH, currentState.mechsPlayed),
			murlocsPlayed: this.cardsPlayedForRace(cardRaces, Race.MURLOC, currentState.murlocsPlayed),
			piratesPlayed: this.cardsPlayedForRace(cardRaces, Race.PIRATE, currentState.piratesPlayed),
			elementalsPlayed: this.cardsPlayedForRace(cardRaces, Race.ELEMENTAL, currentState.elementalsPlayed),
			nagasPlayed: this.cardsPlayedForRace(cardRaces, Race.NAGA, currentState.nagasPlayed),
			undeadPlayed: this.cardsPlayedForRace(cardRaces, Race.UNDEAD, currentState.undeadPlayed),
			spellsPlayed: isSpell ? currentState.spellsPlayed + 1 : currentState.spellsPlayed,
		});
	}

	private cardsPlayedForRace(cardRaces: readonly string[], race: Race, field: number): number {
		return cardRaces?.includes(Race[race]) ? field + 1 : field;
	}
}
