import { CardType, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Action, FullEntity, Node, PlayerEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';

export class BattlegroundsNextOpponentParser implements ActionParser {
	readonly ParserName = 'BattlegroundsNextOpponentParser';

	private GameState: GameState;
	private ParserState: ParserState;

	constructor(parserState: ParserState) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.NEXT_OPPONENT_PLAYER_ID as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			((node.Type === PlayerEntity &&
				(node.Object as PlayerEntity).Tags.find(
					(tag) => tag.Name === (GameTag.NEXT_OPPONENT_PLAYER_ID as number),
				) != null) ||
				(node.Type === FullEntity &&
					(node.Object as FullEntity).Tags.find(
						(tag) => tag.Name === (GameTag.NEXT_OPPONENT_PLAYER_ID as number),
					) != null))
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const isInAction = node.Parent != null && node.Parent.Type === Action;
		if (isInAction && (node.Parent!.Object as Action).Entity !== this.GameState.GetGameEntity()?.Entity) {
			return null;
		}

		const heroes = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === tagChange.Value)
			.filter(
				(entity) =>
					!entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
			);
		const hero = heroes.length === 0 ? null : heroes[0];
		if (hero == null) {
			this.GameState.NextBgsOpponentPlayerId = tagChange.Value;
		}
		if (hero?.CardId != null && hero.CardId.length > 0 && !hero.IsBaconBartender()) {
			this.GameState.BgsHasSentNextOpponent = true;
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'BATTLEGROUNDS_NEXT_OPPONENT',
					() => ({
						Type: 'BATTLEGROUNDS_NEXT_OPPONENT',
						Value: {
							CardId: hero.CardId,
							OpponentPlayerId: tagChange.Value,
						},
					}),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const tags =
			node.Type === PlayerEntity
				? (node.Object as PlayerEntity).Tags
				: (node.Object as FullEntity).Tags;
		const timestamp =
			node.Type === PlayerEntity
				? (node.Object as PlayerEntity).TimeStamp
				: (node.Object as FullEntity).TimeStamp;
		const nextOpponentPlayerId = tags.find(
			(tag) => tag.Name === (GameTag.NEXT_OPPONENT_PLAYER_ID as number),
		)!.Value;
		const heroes = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
			.filter(
				(entity) =>
					!entity.IsBaconBartender() && !entity.IsBaconGhost() && !entity.IsBaconEnchantment(),
			);
		const hero = heroes.length === 0 ? null : heroes[0];
		this.GameState.NextBgsOpponentPlayerId = nextOpponentPlayerId;
		this.GameState.BgsHasSentNextOpponent = true;
		if (hero?.CardId != null && hero.CardId.length > 0 && !hero.IsBaconBartender()) {
			return [
				GameEventProvider.Create(
					timestamp,
					'BATTLEGROUNDS_NEXT_OPPONENT',
					() => ({
						Type: 'BATTLEGROUNDS_NEXT_OPPONENT',
						Value: {
							CardId: hero.CardId,
							OpponentPlayerId: nextOpponentPlayerId,
						},
					}),
					true,
					node,
				),
			];
		}
		return null;
	}
}
