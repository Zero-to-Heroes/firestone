using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MaxResourcesChangedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MaxResourcesChangedParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && ((tagChange = (node.Object as TagChange)).Name == (int)GameTag.MAXRESOURCES 
                    || tagChange.Name == (int)GameTag.HEALTH
                    || tagChange.Name == (int)GameTag.BACON_MAX_RESOURCES);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            if (tagChange.Name == (int)GameTag.MAXRESOURCES)
            {
                return HandleMaxMana(node);
            }
            else if (tagChange.Name == (int)GameTag.HEALTH)
            {
                return HandleMaxHealth(node);
            }
            else if (tagChange.Name == (int)GameTag.BACON_MAX_RESOURCES)
            {
                return HandleMaxCoins(node);
            }
            return null;
        }

        public List<GameEventProvider> HandleMaxHealth(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            if (!entity.IsHero() || !entity.IsInPlay())
            {
                return null;
            }

            var newHealth = tagChange.Name == (int)GameTag.HEALTH ? tagChange.Value : entity.GetTag(GameTag.HEALTH);
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "MAX_RESOURCES_UPDATED",
                GameEvent.CreateProvider(
                    "MAX_RESOURCES_UPDATED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        Health = newHealth,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> HandleMaxMana(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            var newMana = tagChange.Name == (int)GameTag.MAXRESOURCES ? tagChange.Value : entity.GetTag(GameTag.MAXRESOURCES);
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "MAX_RESOURCES_UPDATED",
                GameEvent.CreateProvider(
                    "MAX_RESOURCES_UPDATED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        Mana = newMana,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> HandleMaxCoins(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            var newCoins = tagChange.Name == (int)GameTag.BACON_MAX_RESOURCES ? tagChange.Value : entity.GetTag(GameTag.BACON_MAX_RESOURCES);
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "MAX_RESOURCES_UPDATED",
                GameEvent.CreateProvider(
                    "MAX_RESOURCES_UPDATED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        Coins = newCoins,
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
