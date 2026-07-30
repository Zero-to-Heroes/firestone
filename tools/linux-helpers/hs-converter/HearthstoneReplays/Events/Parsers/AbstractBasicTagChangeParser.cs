using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public abstract class AbstractBasicTagChangeParser : ActionParser
    {
        protected GameState GameState { get; set; }
        protected ParserState ParserState { get; set; }
        protected StateFacade StateFacade { get; set; }

        protected GameTag targetTag { get; set; }
        protected string eventName { get; set; }

        public AbstractBasicTagChangeParser(ParserState ParserState, StateFacade facade, GameTag tag, string eventName)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
            this.targetTag = tag;
            this.eventName = eventName;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)this.targetTag;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                this.eventName,
                GameEvent.CreateProvider(
                    this.eventName,
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        Value = tagChange.Value,
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
