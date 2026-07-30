using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class StartOfGameTriggerParser : ActionParser
    {
        private static List<string> FORCE_START_OF_GAME_POWERS = new List<string>() { CardIds.PrinceRenathal, CardIds.PrinceRenathal_CORE_REV_018 };

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public StartOfGameTriggerParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            Action action = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Action)
                && (action = node.Object as Action).Type == (int)BlockType.TRIGGER
                && (action.TriggerKeyword == (int)GameTag.START_OF_GAME_KEYWORD || action.TriggerKeyword == (int)GameTag.TAG_NOT_SET);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var action = node.Object as Action;
            var actionEntity = GameState.CurrentEntities.GetValueOrDefault(action.Entity);
            if (action.TriggerKeyword == (int)GameTag.TAG_NOT_SET && !FORCE_START_OF_GAME_POWERS.Contains(actionEntity?.CardId))
            {
                return null;
            }

            var controllerId = actionEntity?.GetTag(GameTag.CONTROLLER) ?? -1;
            return new List<GameEventProvider> { GameEventProvider.Create(
                action.TimeStamp,
                "START_OF_GAME",
                GameEvent.CreateProvider(
                    "START_OF_GAME",
                    actionEntity?.CardId,
                    controllerId,
                    action.Entity,
                    StateFacade,
                    null),
                true,
                node) 
            };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
