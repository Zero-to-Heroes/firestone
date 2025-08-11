import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { ActionChainParser } from './action-chains/_action-chain-parser';
import { FuturisticForefatherParser } from './action-chains/futuristic-forefather-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class ActionsChainParser implements EventParser {
	private events: GameEvent[] = [];
	private chainParser: { [eventKey: string]: ActionChainParser[] } = {
		[GameEvent.SUB_SPELL_START]: [new FuturisticForefatherParser()],
	};

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

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
