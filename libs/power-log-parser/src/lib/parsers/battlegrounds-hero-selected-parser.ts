import { CardType, GameTag, GameType, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Choice, FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsHeroSelectedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsHeroSelectedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.GameState &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === NodeType.Choice &&
			this.ParserState.CurrentChosenEntites != null
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		let fullEntity: FullEntity | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			(this.GameState.GetGameEntity()?.GetTag(GameTag.BG_BATTLE_STARTING) ?? 0) !== 1 &&
			node.Type === NodeType.FullEntity &&
			(fullEntity = node.Object as FullEntity).GetTag(GameTag.CARDTYPE) === (CardType.HERO as number) &&
			fullEntity.GetTag(GameTag.ZONE) === (Zone.PLAY as number) &&
			fullEntity.GetTag(GameTag.REPLACEMENT_ENTITY) !== 1 &&
			!(
				fullEntity.SubSpellInEffect?.Prefab?.startsWith(
					'ReuseFX_Generic_OverrideSpawn_FromPortal_Super_Random_SuppressPlaySounds',
				) ?? false
			)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const choice = node.Object as Choice;
		const chosenEntity = this.GameState.CurrentEntities.get(choice.Entity);
		if (chosenEntity == null || chosenEntity.GetTag(GameTag.CARDTYPE) !== (CardType.HERO as number)) {
			return null;
		}
		if (chosenEntity.GetTag(GameTag.ZONE) !== (Zone.HAND as number)) {
			return null;
		}
		if (chosenEntity.IsBaconEnchantment()) {
			return null;
		}

		const controllerId = chosenEntity.GetEffectiveController();
		const playerEntity = this.GameState.GetController(controllerId);
		const nextOpponentPlayerId = playerEntity?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID, 0) ?? 0;

		return [
			GameEventProvider.Create(
				choice.TimeStamp,
				'BATTLEGROUNDS_HERO_SELECTED',
				() => {
					if (!this.StateFacade.IsBattlegrounds()) {
						return null;
					}
					if (controllerId !== this.StateFacade.LocalPlayer!.PlayerId) {
						return null;
					}

					return {
						Type: 'BATTLEGROUNDS_HERO_SELECTED',
						Value: {
							CardId: chosenEntity.CardId,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
							Health: chosenEntity.GetTag(GameTag.HEALTH),
							Armor: chosenEntity.GetTag(GameTag.ARMOR, 0),
							NextOpponentPlayerId: nextOpponentPlayerId,
						},
					};
				},
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		return [
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'BATTLEGROUNDS_HERO_SELECTED',
				() => this.BuildGameEvent(node),
				true,
				node,
			),
		];
	}

	private BuildGameEvent(node: Node): { Type: string; Value: any } | null {
		const fullEntity = node.Object as FullEntity;
		if (!this.StateFacade.IsBattlegrounds()) {
			return null;
		}

		if (fullEntity.GetEffectiveController() !== this.StateFacade.LocalPlayer!.PlayerId) {
			return null;
		}

		if (fullEntity.IsBaconEnchantment()) {
			return null;
		}

		const nextOpponentPlayerId = fullEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
		const heroes = [...this.GameState.CurrentEntities.values()]
			.filter((entity) => entity.GetTag(GameTag.CARDTYPE) === (CardType.HERO as number))
			.filter((entity) => entity.GetTag(GameTag.PLAYER_ID) === nextOpponentPlayerId)
			.filter((entity) => !entity.IsBaconBartender() && !entity.IsBaconGhost());
		const hero = heroes == null || heroes.length === 0 ? null : heroes[0];
		if (hero == null) {
			this.GameState.NextBgsOpponentPlayerId = nextOpponentPlayerId;
		}

		return {
			Type: 'BATTLEGROUNDS_HERO_SELECTED',
			Value: {
				CardId: fullEntity.CardId,
				LocalPlayer: this.StateFacade.LocalPlayer,
				OpponentPlayer: this.StateFacade.OpponentPlayer,
				LeaderboardPlace: fullEntity.GetLeaderboardPosition(
					this.StateFacade.GetMetaData().GameType as GameType,
				),
				Health: fullEntity.GetTag(GameTag.HEALTH),
				Armor: fullEntity.GetTag(GameTag.ARMOR, 0),
				Damage: fullEntity.GetTag(GameTag.DAMAGE),
				TavernLevel: fullEntity.GetTag(GameTag.PLAYER_TECH_LEVEL),
				NextOpponentCardId: hero?.CardId ?? null,
				NextOpponentPlayerId: nextOpponentPlayerId,
			},
		};
	}
}
