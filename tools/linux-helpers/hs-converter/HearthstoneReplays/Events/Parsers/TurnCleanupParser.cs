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
    // This class is just to be able to call GameState.OnNewTurn()
    public class TurnCleanupParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public TurnCleanupParser(ParserState ParserState, StateFacade helper)
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
                && GameState.GetGameEntity()?.Entity == (node.Object as TagChange).Entity;
            return stateType == StateType.GameState
                && (isNormalTurnChange || isMercenariesTurnChange);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var newTurnValue = tagChange.Name == (int)GameTag.TURN ? (int)tagChange.Value : GameState.CurrentTurn + 1;
            GameState.CurrentTurn = newTurnValue;
            GameState.OnNewTurn();
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
