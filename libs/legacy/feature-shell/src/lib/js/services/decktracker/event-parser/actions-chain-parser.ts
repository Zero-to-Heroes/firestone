import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { ActionChainParser } from './action-chains/_action-chain-parser';
import { FuturisticForefatherParser } from './action-chains/futuristic-forefather-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { WaveshapingParser } from './action-chains/waveshaping-parser';
import { BirdwatchingParser } from './action-chains/birdwatching';

export class ActionsChainParser implements EventParser {
	public static readonly REGISTERED_EVENT_TYPES = [
		GameEvent.SUB_SPELL_START,
		GameEvent.GAME_START,
		GameEvent.GAME_END,
		GameEvent.CHOOSING_OPTIONS,
		GameEvent.ENTITY_CHOSEN,
		GameEvent.LINKED_ENTITY,
		GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
	];

	private events: GameEvent[] = [];
	private chainParser: { [eventKey: string]: ActionChainParser[] };

	constructor(helper: DeckManipulationHelper, cards: CardsFacadeService, i18n: LocalizationFacadeService) {
		const parsers = [
			new FuturisticForefatherParser(),
			// new WaveshapingParser(helper)
			new BirdwatchingParser(helper, cards),
		];
		this.chainParser = {};
		for (const parser of parsers) {
			this.chainParser[parser.appliesOnEvent()] = [parser];
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
