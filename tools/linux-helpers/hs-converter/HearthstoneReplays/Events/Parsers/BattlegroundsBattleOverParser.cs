using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Events.Parsers.Utils;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsBattleOverParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsBattleOverParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            // The tag change is only used as a fallback mechanism in case no battle result was sent
            // This can happen in case of draws sometimes
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && !GameState.BattleResultSent
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.BOARD_VISUAL_STATE
                && (node.Object as TagChange).Value == 1;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(Action)
                && (node.Object as Action).Type == (int)BlockType.TRIGGER
                // Also modify this in trigger-sync KDA
                // To know the value, look at the ATTACK node in which a hero deals damage to another
                && (node.Object as Action).EffectIndex == 14;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            GameState.BattleResultSent = true;
            var tagChange = node.Object as TagChange;
            string opponentCardId = GameState.BgsCurrentBattleOpponent;
            int opponentPlayerId = GameState.BgsCurrentBattleOpponentPlayerId;
            var mainPlayer = StateFacade.LocalPlayer;
            if (opponentCardId == null || BgsUtils.IsBaconGhost(opponentCardId))
            {
                // Finding the one that is flagged as the player's NEXT_OPPONENT
                var playerEntity = GameState.CurrentEntities.Values
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetEffectiveController() == mainPlayer.PlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .OrderBy(entity => entity.Id)
                    .LastOrDefault();
                var nextOpponentPlayerId = playerEntity.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);

                var nextOpponentCandidates = GameState.CurrentEntities.Values
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .ToList();
                var nextOpponent = nextOpponentCandidates == null || nextOpponentCandidates.Count == 0 ? null : nextOpponentCandidates[0];

                opponentCardId = nextOpponent?.CardId;
                opponentPlayerId = nextOpponent?.GetTag(GameTag.PLAYER_ID) ?? 0;
            }

            var debug = opponentCardId == "TB_BaconShop_HERO_27" && opponentPlayerId == 9;
            return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                     "BATTLEGROUNDS_BATTLE_RESULT",
                    () => new GameEvent
                    {
                        Type = "BATTLEGROUNDS_BATTLE_RESULT",
                        Value = new
                        {
                            Opponent = opponentCardId,
                            OpponentPlayerId = opponentPlayerId,
                            Result = "tied"
                        }
                    },
                    true,
                    node)
                };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Action;
            var actionEntity = GameState.CurrentEntities[action.Entity];
            if (actionEntity.CardId != "TB_BaconShop_8P_PlayerE")
            {
                return null;
            }

            var isAttackNode = action.Data
                .Where(data => data.GetType() == typeof(TagChange))
                .Select(data => data as TagChange)
                .Where(tag => (tag.Name == (int)GameTag.HIGHLIGHT_ATTACKING_MINION_DURING_COMBAT && tag.Value == 0))
                .Count() > 0;
            if (!isAttackNode)
            {
                return null;
            }

            GameState.BattleResultSent = true;
            var attackAction = action.Data
                .Where(data => data.GetType() == typeof(Action))
                .Select(data => data as Action)
                .Where(act => act.Type == (int)BlockType.ATTACK)
                .FirstOrDefault();

            var opponentPlayerId = StateFacade.OpponentPlayer.PlayerId;
            if (attackAction == null)
            {
                var battleResult = "tied";
                var gsPlayer = StateFacade.GsState.GameState.CurrentEntities[StateFacade.LocalPlayer.Id];
                // If a player died because of demon health-consuming effects, there is no attack, but the battle isn't tied
                if (gsPlayer.GetTag(GameTag.PLAYSTATE) == (int)PlayState.LOST)
                {
                    battleResult = "lost";
                }
                else if (gsPlayer.GetTag(GameTag.PLAYSTATE) == (int)PlayState.WON)
                {
                    battleResult = "won";
                }

                var opponentHero = GameState.CurrentEntities.Values
                    .Where(data => data.GetEffectiveController() == opponentPlayerId)
                    .Where(data => data.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(data => data.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .FirstOrDefault();
                var cardId = opponentHero?.CardId;
                if (BgsUtils.IsBaconGhost(cardId))
                {
                    // Find the nexwt_opponent_id
                    var player = GameState.CurrentEntities[StateFacade.LocalPlayer.Id];
                    opponentPlayerId = player.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);
                    opponentHero = GameState.CurrentEntities.Values
                        .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == opponentPlayerId)
                        .Where(entity => !entity.IsBaconBartender()
                            && !entity.IsBaconGhost()
                            && !entity.IsBaconEnchantment())
                        .FirstOrDefault();
                    cardId = opponentHero?.CardId;
                }

                var debug = cardId == "TB_BaconShop_HERO_27" && opponentPlayerId == 9;
                return new List<GameEventProvider> { GameEventProvider.Create(
                    action.TimeStamp,
                     "BATTLEGROUNDS_BATTLE_RESULT",
                    () => new GameEvent
                    {
                        Type = "BATTLEGROUNDS_BATTLE_RESULT",
                        Value = new
                        {
                            Opponent = cardId,
                            OpponentPlayerId = opponentPlayerId,
                            Result = battleResult
                        }
                    },
                    true,
                    node)
                };
            }

            var winner = GameState.CurrentEntities[attackAction.Entity];
            var result = winner.GetEffectiveController() == StateFacade.LocalPlayer.PlayerId ? "won" : "lost";
            var damageTag = attackAction.Data
                .Where(data => data.GetType() == typeof(TagChange))
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.PREDAMAGE)
                .FirstOrDefault();
            var attackerEntityId = attackAction.Data
                .Where(data => data.GetType() == typeof(TagChange))
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.ATTACKING && tag.Value == 1)
                .FirstOrDefault()
                .Entity;
            var defenderEntityId = attackAction.Data
                .Where(data => data.GetType() == typeof(TagChange))
                .Select(data => data as TagChange)
                .Where(tag => tag.Name == (int)GameTag.DEFENDING && tag.Value == 1)
                .FirstOrDefault()
                .Entity;
            var opponentEntityId = GameState.CurrentEntities[attackerEntityId].GetEffectiveController() == StateFacade.LocalPlayer.PlayerId
                ? defenderEntityId
                : attackerEntityId;
            var opponentCardId = GameState.CurrentEntities[opponentEntityId].CardId;
            opponentPlayerId = GameState.CurrentEntities[opponentEntityId].GetTag(GameTag.PLAYER_ID);
            var mainPlayer = StateFacade.LocalPlayer;
            if (opponentCardId == Kelthuzad_TB_BaconShop_HERO_KelThuzad)
            {
                // Finding the one that is flagged as the player's NEXT_OPPONENT
                var playerEntity = GameState.CurrentEntities.Values
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                    .Where(entity => entity.GetEffectiveController() == mainPlayer.PlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .OrderBy(entity => entity.Id)
                    .LastOrDefault();
                // Sometimes there is no player entity, but I don't know why
                var nextOpponentPlayerId = playerEntity?.GetTag(GameTag.NEXT_OPPONENT_PLAYER_ID);

                var nextOpponentCandidates = GameState.CurrentEntities.Values
                    .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                    .Where(entity => entity.GetTag(GameTag.PLAYER_ID) == nextOpponentPlayerId)
                    .Where(entity => !entity.IsBaconBartender()
                        && !entity.IsBaconGhost()
                        && !entity.IsBaconEnchantment())
                    .ToList();
                var nextOpponent = nextOpponentCandidates == null || nextOpponentCandidates.Count == 0 ? null : nextOpponentCandidates[0];

                opponentCardId = nextOpponent?.CardId;
                opponentPlayerId = nextOpponentPlayerId ?? 0;
            }
            var damage = damageTag != null ? damageTag.Value : 0;

            return new List<GameEventProvider> { GameEventProvider.Create(
                action.TimeStamp,
                "BATTLEGROUNDS_BATTLE_RESULT",
                () => new GameEvent
                {
                    Type = "BATTLEGROUNDS_BATTLE_RESULT",
                    Value = new
                    {
                        Opponent = opponentCardId,
                        OpponentPlayerId = opponentPlayerId,
                        Result = result,
                        Damage = damage,
                    }
                },
                true,
                node)
            };
        }
    }
}
