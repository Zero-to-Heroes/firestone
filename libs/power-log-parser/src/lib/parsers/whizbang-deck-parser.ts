import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, FullEntity, Node, PlayerEntity, ShowEntity } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class WhizbangDeckParser implements ActionParser {
	readonly ParserName = 'WhizbangDeckParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const oldWhizbangAndLegacy = node.Type === PlayerEntity;
		const newWhizbang = node.Type === FullEntity || node.Type === ShowEntity;
		return stateType === StateType.PowerTaskList && (oldWhizbangAndLegacy || newWhizbang);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		if (node.Type === PlayerEntity) {
			return this.createFromPlayerEntity(node);
		} else if (node.Type === FullEntity) {
			return this.createFromFullEntity(node);
		} else {
			return this.createFromShowEntity(node);
		}
	}

	private createFromFullEntity(node: Node): GameEventProvider[] | null {
		const entity = node.Object as FullEntity;
		const parentAction = node.Parent?.Type === Action ? (node.Parent.Object as Action) : null;
		if (parentAction == null) {
			return null;
		}

		const whizbangDeckId = this.getSplendiferousDeckIdFromString(entity.CardId);
		if (whizbangDeckId === -1) {
			return null;
		}

		return [
			GameEventProvider.Create(
				entity.TimeStamp,
				'WHIZBANG_DECK_ID',
				GameEventHelper.CreateProvider(
					'WHIZBANG_DECK_ID',
					null as any,
					entity.GetEffectiveController(),
					entity.Id,
					this.StateFacade,
					{
						DeckId: whizbangDeckId,
					},
				),
				true,
				node,
			),
		];
	}

	private createFromShowEntity(node: Node): GameEventProvider[] | null {
		const entity = node.Object as ShowEntity;
		const parentAction = node.Parent?.Type === Action ? (node.Parent.Object as Action) : null;
		if (parentAction == null) {
			return null;
		}

		const whizbangDeckId = this.getSplendiferousDeckIdFromString(entity.CardId);
		if (whizbangDeckId === -1) {
			return null;
		}

		return [
			GameEventProvider.Create(
				entity.TimeStamp,
				'WHIZBANG_DECK_ID',
				GameEventHelper.CreateProvider(
					'WHIZBANG_DECK_ID',
					null as any,
					entity.GetEffectiveController(),
					entity.Entity,
					this.StateFacade,
					{
						DeckId: whizbangDeckId,
					},
				),
				true,
				node,
			),
		];
	}

	private createFromPlayerEntity(node: Node): GameEventProvider[] | null {
		const playerEntity = node.Object as PlayerEntity;
		let whizbangDeckId =
			playerEntity.PlayerId === this.StateFacade.OpponentPlayer?.PlayerId
				? -1
				: playerEntity.GetTag(GameTag.WHIZBANG_DECK_ID);
		if (whizbangDeckId === -1) {
			const splendiferousCardId = playerEntity.GetTag(GameTag.WHIZBANG_SPLENDIFEROUS_DECK_ID);
			if (splendiferousCardId !== -1) {
				whizbangDeckId = this.getSplendiferousDeckIdFromNumber(splendiferousCardId);
			}
		}
		if (whizbangDeckId === -1) {
			return null;
		}

		return [
			GameEventProvider.Create(
				playerEntity.TimeStamp,
				'WHIZBANG_DECK_ID',
				GameEventHelper.CreateProvider(
					'WHIZBANG_DECK_ID',
					null as any,
					playerEntity.GetEffectiveController(),
					playerEntity.Id,
					this.StateFacade,
					{
						DeckId: whizbangDeckId,
					},
				),
				true,
				node,
			),
		];
	}

	private getSplendiferousDeckIdFromNumber(splendiferousCardId: number): number {
		switch (splendiferousCardId) {
			case 106243: return 5342;
			case 106244: return 5343;
			case 106245: return 5345;
			case 106246: return 5344;
			case 106248: return 5385;
			case 106249: return 5346;
			case 106252: return 5381;
			case 106253: return 5382;
			case 106251: return 5383;
			case 106250: return 5384;
			case 108932: return 5410;
			default: return -1;
		}
	}

	private getSplendiferousDeckIdFromString(splendiferousCardId: string): number {
		switch (splendiferousCardId) {
			case 'TOY_700t1': return 5342;
			case 'TOY_700t2': return 5343;
			case 'TOY_700t3': return 5345;
			case 'TOY_700t4': return 5344;
			case 'TOY_700t6': return 5385;
			case 'TOY_700t7': return 5346;
			case 'TOY_700t10': return 5381;
			case 'TOY_700t11': return 5382;
			case 'TOY_700t9': return 5383;
			case 'TOY_700t8': return 5384;
			case 'TOY_700t12': return 5410;
			default: return -1;
		}
	}
}
