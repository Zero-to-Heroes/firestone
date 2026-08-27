using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    // Used to notify when the STATE switches to RUNNING, which signifies the initial deck and board population has been done
    public class GameRunningParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade Helper { get; set; }

        public GameRunningParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.Helper = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.STATE
                && (node.Object as TagChange).Value == (int)State.RUNNING;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            // We don't want to wait to get the current state, as it's possible that some cards have 
            // already been drawn by then
            var stateCopy = ParserState.GameState.CurrentEntities.Values
                    .Where(entity => entity.GetTag(GameTag.ZONE) == (int)Zone.DECK)
                    .Select(entity => entity.GetEffectiveController())
                    .ToList();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "GAME_RUNNING",
                () => {
                    // LocalPlayer can be empty when handled in the Chinese official replay viewer?
                    // Not sure exactly how it works, but it looks like the "spectator end/start" events
                    // 
                    var playerDeckCount = stateCopy
                            .Where(entity => entity == Helper.LocalPlayer.PlayerId)
                            .ToList()
                            .Count();
                    var opponentDeckCount = stateCopy
                            .Where(entity => entity == Helper.OpponentPlayer.PlayerId)
                            .ToList()
                            .Count();
                    return new GameEvent
                        {
                            Type = "GAME_RUNNING",
                            Value = new
                            {
                                LocalPlayer = Helper.LocalPlayer,
                                OpponentPlayer = Helper.OpponentPlayer,
                                AdditionalProps = new
                                {
                                    PlayerDeckCount = playerDeckCount,
                                    OpponentDeckCount = opponentDeckCount,
                                }
                            }
                        };
                },
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
