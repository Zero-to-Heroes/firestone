import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { ActionChainParser } from './action-chains/_action-chain-parser';
import { FuturisticForefatherParser } from './action-chains/futuristic-forefather-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ActionsChainParser implements EventParser {
	private events: GameEvent[] = [];
	private chainParser: { [eventKey: string]: ActionChainParser[] } = {
		[GameEvent.SUB_SPELL_START]: [new FuturisticForefatherParser()],
	};

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
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
