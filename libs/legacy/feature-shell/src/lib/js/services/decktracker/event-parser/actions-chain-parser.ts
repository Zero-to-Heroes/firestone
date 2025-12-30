import { cardsInfoCache, GameState, hasChainParsingCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { ActionChainParser } from './action-chains/_action-chain-parser';
import { BirdwatchingParser } from './action-chains/birdwatching';
import { DoommaidenParser } from './action-chains/doommaiden';
import { FuturisticForefatherParser } from './action-chains/futuristic-forefather-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ActionsChainParser implements EventParser {
	public static readonly REGISTERED_EVENT_TYPES = [
		GameEvent.CARD_CHANGED_IN_HAND,
		GameEvent.CARD_PLAYED,
		GameEvent.CARD_REMOVED_FROM_BOARD,
		GameEvent.CARD_REMOVED_FROM_DECK,
		GameEvent.SPECIAL_TARGET,
		GameEvent.CARD_STOLEN,
		GameEvent.CHOOSING_OPTIONS,
		GameEvent.ENTITY_CHOSEN,
		GameEvent.GAME_END,
		GameEvent.GAME_START,
		GameEvent.LINKED_ENTITY,
		GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
		GameEvent.SUB_SPELL_END,
		GameEvent.SUB_SPELL_START,
	];

	private events: GameEvent[] = [];
	private chainParser: { [eventKey: string]: ActionChainParser[] };

	constructor(helper: DeckManipulationHelper, cards: CardsFacadeService, i18n: LocalizationFacadeService) {
		const parsers = [
			new FuturisticForefatherParser(),
			// new WaveshapingParser(helper)
			new BirdwatchingParser(helper, cards),
			new DoommaidenParser(helper, cards),
		];

		for (const cardId of Object.keys(cardsInfoCache)) {
			const cardImpl = cardsInfoCache[cardId];
			if (hasChainParsingCard(cardImpl)) {
				parsers.push(cardImpl.chainParser(cards.getService()));
			}
		}
		this.chainParser = {};
		for (const parser of parsers) {
			const eventType = parser.appliesOnEvent();
			this.chainParser[eventType] = [...(this.chainParser[eventType] ?? []), parser];
		}
	}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		if (gameEvent.type === GameEvent.GAME_START || gameEvent.type === GameEvent.GAME_END) {
			this.events = [];
			return currentState;
		}

		if (currentState.isBattlegrounds()) {
			return currentState;
		}

		this.events.push(gameEvent);

		const chainParsers = this.chainParser[gameEvent.type] ?? [];
		let newState = currentState;
		for (const chainParser of chainParsers) {
			newState = await chainParser.parse(newState, this.events);
		}
		return newState;
	}

	event(): string {
		return 'ACTIONS_CHAIN';
	}
}
