import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class SpellCounterDefinition implements CounterDefinition {
	readonly type = 'spells';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): SpellCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const spellsPlayed = deck.spellsPlayedThisMatch?.length ?? 0;
		return {
			type: 'spells',
			value: spellsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.YoggSaronMasterOfFate}.jpg`,
			cssClass: 'spell-counter',
			tooltip: i18n.translateString(`counters.spell.${side}`, { value: spellsPlayed }),
			standardCounter: true,
		};
	}
}
