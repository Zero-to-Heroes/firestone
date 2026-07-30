using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class InitialCardInDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public InitialCardInDeckParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var appliesOnFullEntity = node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.DECK
                // We want only the cards created when the game starts
                && node.Parent.Type == typeof(GameAction);
            return stateType == StateType.PowerTaskList
                && appliesOnFullEntity;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            var controllerId = fullEntity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "INITIAL_CARD_IN_DECK",
                GameEvent.CreateProvider(
                    "INITIAL_CARD_IN_DECK",
                    null,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    null),
                true,
                node) };
        }
    }
}
