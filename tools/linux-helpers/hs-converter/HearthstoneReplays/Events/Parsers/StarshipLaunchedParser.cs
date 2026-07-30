using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class StarshipLaunchedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public StarshipLaunchedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.LAUNCHPAD && (node.Object as TagChange).Value == 0;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null || entity.GetTag(GameTag.LAUNCHPAD) != 1)
            {
                return null;
            }

            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            var tags = entity.GetTagsCopy();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "STARSHIP_LAUNCHED",
                GameEvent.CreateProvider(
                    "STARSHIP_LAUNCHED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    new {
                        tags = tags,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
