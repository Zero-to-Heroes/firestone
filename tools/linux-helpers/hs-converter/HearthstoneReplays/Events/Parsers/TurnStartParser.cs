using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace HearthstoneReplays.Events.Parsers
{
    public class TurnStartParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public TurnStartParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            var isNormalTurnChange = !ParserState.IsMercenaries() 
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.TURN
                && GameState.GetGameEntity()?.Entity == (node.Object as TagChange).Entity;
            // While the TURN tag is present in mercenaries, it is incremented on the Innkeeper entity,
            // and the logs don't let us easily disambiguate between the AI Innkeeper and the player's
            // Innkeeper, so we rely on the turn structure tags instead
            var isMercenariesTurnChange = ParserState.IsMercenaries()
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.STEP
                && (node.Object as TagChange).Value == (int)Step.MAIN_PRE_ACTION
                && GameState.GetGameEntity()?.Entity == (node.Object as TagChange).Entity
                && !IsSelectingMercs();
            return stateType == StateType.PowerTaskList
                && (isNormalTurnChange || isMercenariesTurnChange);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var isGameNode = node.Type == typeof(GameEntity);
            return stateType == StateType.PowerTaskList
                && (ParserState.ReconnectionOngoing || StateFacade.Spectating)
                && isGameNode;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var newTurnValue = tagChange.Name == (int)GameTag.TURN ? (int)tagChange.Value : GameState.CurrentTurn + 1;
            GameState.CurrentTurn = newTurnValue;
            //GameState.StartTurn();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            var result = new List<GameEventProvider>();
            // This event system is sometimes a mess - in some cases we want to reset the info when the event is sent
            // and in others we want to reset the game state, so as it is processed
            GameState.ClearPlagiarize();
            // FIXME?: maybe this should not be inside the event provider, but rather apply on the GameState
            GameState.OnNewTurn();

            var timestamp = Utility.GetUtcTimestamp(tagChange.TimeStamp);
            var currentPlayer = GameState.GetActivePlayerId();
            result.Add(GameEventProvider.Create(
                   tagChange.TimeStamp,
                   "TURN_START",
                   () =>
                   {
                       return new GameEvent
                       {
                           Type = "TURN_START",
                           Value = new
                           {
                               Turn = newTurnValue,
                               ActivePlayerId = currentPlayer,
                               //GameState = gameState,
                               LocalPlayer = StateFacade.LocalPlayer,
                               OpponentPlayer = StateFacade.OpponentPlayer,
                               Timestamp = timestamp,
                           }
                       };
                   },
                   false,
                   node));
            // This seems the most reliable way to have the combat_start event as soon as possible
            if (StateFacade.IsBattlegrounds())
            {
                var visualBoardState = GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE);
                if (newTurnValue % 2 == 0)
                {
                    Logger.Log("Prep BATTLEGROUNDS_COMBAT_START", "");
                    GameState.BattleResultSent = false;
                    var heroes = BuildHeroes(GameState);
                    result.Add(GameEventProvider.Create(
                        tagChange.TimeStamp,
                        "BATTLEGROUNDS_COMBAT_START",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_COMBAT_START",
                            Value = new
                            {
                                Turn = newTurnValue,
                                Heroes = heroes,
                                VisualBoardState = visualBoardState,
                            }
                        },
                        false,
                        node));
                }
                else
                {
                    Logger.Log("Prep BATTLEGROUNDS_RECRUIT_PHASE", "");
                    var heroes = BuildHeroes(GameState);
                    result.Add(GameEventProvider.Create(
                        tagChange.TimeStamp,
                        "BATTLEGROUNDS_RECRUIT_PHASE",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_RECRUIT_PHASE",
                            Value = new
                            {
                                Turn = newTurnValue,
                                Heroes = heroes,
                                VisualBoardState = visualBoardState,
                            }
                        },
                        false,
                        node));
                }

                if (newTurnValue % 2 != 0)
                {
                    // When at the top2 stage, the event isn't sent anymore, so we send a default event
                    // when the turn starts (from what I've seen, the event is always sent before the turn
                    // starts)
                    // Do it first so that it happens before the TURN_START event
                    if (!GameState.BgsHasSentNextOpponent)
                    {
                        //Logger.Log("Has not sent next opponent", "");
                        result.Add(GameEventProvider.Create(
                            tagChange.TimeStamp,
                            "BATTLEGROUNDS_NEXT_OPPONENT",
                            () => new GameEvent
                            {
                                Type = "BATTLEGROUNDS_NEXT_OPPONENT",
                                Value = new
                                {
                                    IsSameOpponent = true,
                                }
                            },
                            true,
                            node)
                        );
                        GameState.BgsHasSentNextOpponent = true;
                    }
                }
            } 
            else
            {
                //Logger.Log("Not a BG game, not sending combat/recruit event", "");
            }
            return result;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var gameEntity = node.Object as GameEntity;
            var currentTurn = gameEntity.GetTag(GameTag.TURN);
            GameState.CurrentTurn = currentTurn;

            var result = new List<GameEventProvider>();
            var timestamp = Utility.GetUtcTimestamp(gameEntity.TimeStamp);
            result.Add(GameEventProvider.Create(
                gameEntity.TimeStamp,
                "TURN_START",
                () =>
                {
                    return new GameEvent
                    {
                        Type = "TURN_START",
                        Value = new
                        {
                            Turn = currentTurn,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            Timestamp = timestamp,
                            ActivePlayerId = GameState.GetActivePlayerId(),
                        }
                    };
                },
                // So that we don't send the "turn start" event before the metadata (which triggers the creation of the 
                // game client-side) is processed
                StateFacade.Spectating,
                node));
            // This seems the most reliable way to have the combat_start event as soon as possible
            if (StateFacade.IsBattlegrounds())
            {
                var visualBoardState = GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE);
                if (currentTurn % 2 == 0)
                {
                    GameState.BattleResultSent = false;
                    var heroes = BuildHeroes(GameState);
                    result.Add(GameEventProvider.Create(
                        gameEntity.TimeStamp,
                        "BATTLEGROUNDS_COMBAT_START",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_COMBAT_START",
                            Value = new
                            {
                                Turn = currentTurn,
                                Heroes = heroes,
                                VisualBoardState = visualBoardState,
                            }
                        },
                        false,
                        node));
                }
                else
                {
                    var heroes = BuildHeroes(GameState);
                    result.Add(GameEventProvider.Create(
                        gameEntity.TimeStamp,
                        "BATTLEGROUNDS_RECRUIT_PHASE",
                        () => new GameEvent
                        {
                            Type = "BATTLEGROUNDS_RECRUIT_PHASE",
                            Value = new
                            {
                                Turn = currentTurn,
                                Heroes = heroes,
                                VisualBoardState = visualBoardState,
                            }
                        },
                        false,
                        node));
                }
            }
            return result;
        }

        private List<Hero> BuildHeroes(GameState gameState)
        {
            return gameState.CurrentEntities.Values
                .Where(entity => entity.IsHero())
                .Where(entity => entity.GetZone() != (int)Zone.REMOVEDFROMGAME)
                .Select(entity => new Hero()
                {
                    CardId = entity.CardId,
                    PlayerId = entity.GetTag(GameTag.PLAYER_ID, 0),
                    EntityId = entity.Id,
                    Health = entity.GetTag(GameTag.HEALTH, 0) - entity.GetTag(GameTag.DAMAGE, 0),
                    Armor = entity.GetTag(GameTag.ARMOR, 0),
                    //debugTags = entity.Tags,
                })
                .Where(hero => hero.PlayerId > 0)
                .ToList();

        }

        private bool IsSelectingMercs()
        {
            var playerEntityIds = ParserState.getPlayers().Select(e => e.Id).ToList();
            var playerEntities = GameState.CurrentEntities.Values
                .Where(e => playerEntityIds.Contains(e.Id))
                .ToList();
            return playerEntities.Any(p => p.GetTag(GameTag.LETTUCE_MERCENARIES_TO_NOMINATE) >= 1);
        }
    }

    internal class Hero
    {
        public string CardId;
        public int PlayerId;
        public int EntityId;
        public int Health;
        public int Armor;
        public object debugTags;
    }
}
