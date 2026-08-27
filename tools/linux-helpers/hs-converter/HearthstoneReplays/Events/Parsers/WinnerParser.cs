using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class WinnerParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public WinnerParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.PLAYSTATE 
                    || (ParserState.IsBattlegrounds() && (node.Object as TagChange).Name == (int)GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED));
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            if (tagChange.Name == (int)GameTag.PLAYSTATE && tagChange.Value == (int)PlayState.WON)
            {
                var winner = (PlayerEntity)ParserState.GetEntity(tagChange.Entity);
                if (winner == null)
                {
                    return null;
                }

                //Logger.Log("Creating event provider for WinnerParser", node.CreationLogLine);
                return new List<GameEventProvider> { GameEventProvider.Create(
                       tagChange.TimeStamp,
                       "WINNER",
                       () => {
                            //Logger.Log("Providing game event for WinnerParser", node.CreationLogLine);
                            return new GameEvent
                            {
                                Type = "WINNER",
                                Value = new
                                {
                                    Winner = winner,
                                    LocalPlayer = StateFacade.LocalPlayer,
                                    OpponentPlayer = StateFacade.OpponentPlayer,
                                }
                            };
                       },
                       true,
                       node) };
            }
            else if (tagChange.Name == (int)GameTag.PLAYSTATE && tagChange.Value == (int)PlayState.TIED)
            {
                return new List<GameEventProvider> { GameEventProvider.Create(
                       tagChange.TimeStamp,
                        "TIE",
                       () => new GameEvent
                       {
                           Type = "TIE"
                       },
                       true,
                       node) };
            }
            else if (tagChange.Name == (int)GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED)
            {
                var isPlayer = tagChange.Entity == StateFacade.LocalPlayer.Id;
                if (!isPlayer)
                {
                    return null;
                }
                return new List<GameEventProvider> { GameEventProvider.Create(
                       tagChange.TimeStamp,
                       "WINNER",
                       () => {
                            //Logger.Log("Providing game event for WinnerParser", node.CreationLogLine);
                            return new GameEvent
                            {
                                Type = "WINNER",
                                Value = new
                                {
                                    Winner = StateFacade.OpponentPlayer,
                                    LocalPlayer = StateFacade.LocalPlayer,
                                    OpponentPlayer = StateFacade.OpponentPlayer,
                                }
                            };
                       },
                       true,
                       node) };

            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
