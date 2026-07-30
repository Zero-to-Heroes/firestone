using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class CopiedFromEntityIdParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CopiedFromEntityIdParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.COPIED_FROM_ENTITY_ID;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                   && node.Type == typeof(ShowEntity)
                   && (node.Object as ShowEntity).GetTag(GameTag.COPIED_FROM_ENTITY_ID) > 0;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            if (GameState.CurrentEntities[tagChange.Entity].GetTag(GameTag.CARDTYPE) == (int)CardType.ENCHANTMENT)
            {
                return null;
            }

            if (!GameState.CurrentEntities.ContainsKey(tagChange.Value))
            {
                return null;
            }

            var copiedEntity = GameState.CurrentEntities[tagChange.Value];
            var copiedCardEntityId = tagChange.Value;
            var copiedCardControllerId = copiedEntity.GetController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "COPIED_FROM_ENTITY_ID",
                GameEvent.CreateProvider(
                    "COPIED_FROM_ENTITY_ID",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CopiedCardControllerId = copiedCardControllerId,
                        CopiedCardEntityId = copiedCardEntityId,
                        CopiedCardZone = copiedEntity.GetZone(),
                        CopiedCardCost = copiedEntity.GetTag(GameTag.COST),
                        CopiedCardAttack = copiedEntity.GetTag(GameTag.ATK),
                        CopiedCardHealth = copiedEntity.GetTag(GameTag.HEALTH),
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            if (GameState.CurrentEntities[showEntity.Entity].GetTag(GameTag.CARDTYPE) == (int)CardType.ENCHANTMENT)
            {
                return null;
            }

            var copiedCardEntityId = showEntity.GetTag(GameTag.COPIED_FROM_ENTITY_ID);
            if (!GameState.CurrentEntities.ContainsKey(copiedCardEntityId))
            {
                return null;
            }

            var entity = GameState.CurrentEntities[showEntity.Entity];
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            var copiedEntity = GameState.CurrentEntities[copiedCardEntityId];
            var copiedCardControllerId = copiedEntity.GetController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "COPIED_FROM_ENTITY_ID",
                GameEvent.CreateProvider(
                    "COPIED_FROM_ENTITY_ID",
                    cardId ?? copiedEntity?.CardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        CopiedCardControllerId = copiedCardControllerId,
                        CopiedCardEntityId = copiedCardEntityId,
                        CopiedCardZone = copiedEntity.GetZone(),
                        CopiedCardCost = copiedEntity.GetTag(GameTag.COST),
                        CopiedCardAttack = copiedEntity.GetTag(GameTag.ATK),
                        CopiedCardHealth = copiedEntity.GetTag(GameTag.HEALTH),
                    }),
                true,
                node) };
        }
    }
}
