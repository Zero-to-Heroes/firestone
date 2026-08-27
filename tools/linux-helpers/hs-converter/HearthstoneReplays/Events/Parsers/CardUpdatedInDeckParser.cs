using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.Meta;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardUpdatedInDeckParser : ActionParser
    {
        private static List<string> SPECIAL_CASE_CARD_IDS = new List<string>()
        {
            CardIds.FindTheImposter_SpyOMaticToken,
            CardIds.DisarmingElemental,
        };

        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardUpdatedInDeckParser(ParserState ParserState, StateFacade facade)
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
            var appliesOnShow = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.DECK
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            var appliesForAction = node.Type == typeof(Action)
                && GameState.CurrentEntities.ContainsKey((node.Object as Action).Entity)
                && SPECIAL_CASE_CARD_IDS.Contains(GameState.CurrentEntities[(node.Object as Action).Entity].CardId);
            return stateType == StateType.PowerTaskList
                && (appliesOnShow || appliesForAction);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(ShowEntity))
            {
                return CreateFromShowEntity(node);
            }
            else if (node.Type == typeof(Action))
            {
                return CreateFromAction(node);
            }
            return null;
        }

        private List<GameEventProvider> CreateFromAction(Node node)
        {
            var action = node.Object as Action;
            var changedEntities = action.Data
                .Where(data => data.GetType() == typeof(MetaData))
                .Select(data => data as MetaData)
                .Where(meta => meta.Meta == (int)MetaDataType.HISTORY_TARGET)
                .SelectMany(meta => meta.MetaInfo)
                .ToList();

            var eventName = "CARD_CHANGED_IN_DECK";
            FullEntity parentEntity = null;
            if (ParserState.GameState.CurrentEntities.TryGetValue(action.Entity, out parentEntity))
            {
                if (parentEntity.HasDredge())
                {
                    eventName = "CARD_DREDGED";
                }
            }

            return changedEntities
                .Select(info =>
                {
                    var entityId = info.Entity;
                    var entity = GameState.CurrentEntities[entityId];
                    return GameEventProvider.Create(
                        info.TimeStamp,
                        eventName,
                        GameEvent.CreateProvider(
                            eventName,
                            entity.CardId,
                            entity.GetController(),
                            entity.Id,
                            StateFacade,
                            //null,
                            new
                            {
                                LastInfluencedByCardId = GameState.CurrentEntities[(node.Object as Action).Entity].CardId,
                            }),
                        true,
                        node);
                })
                .ToList();
        }

        private List<GameEventProvider> CreateFromShowEntity(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            // Cards here are just created to show the info, then put aside. We don't want to 
            // show them in the "Other" zone, so we just ignore them
            if (showEntity.SubSpellInEffect?.Prefab == "DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX")
            {
                return null;
            }

            var cardId = showEntity.CardId;
            // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
            // have a special rule
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;
            if (isBeforeMulligan && cardId == CardIds.EncumberedPackMule)
            {
                return null;
            }

            var entity = GameState.CurrentEntities[showEntity.Entity];
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);

            var parentNode = node.Parent?.Object;
            if (parentNode?.GetType() == typeof(Action))
            {
                var parentAction = node.Parent.Object as Action;
                // Harpoon Gun is a TRIGGER
                if (parentAction.Type == (int)BlockType.POWER || parentAction.Type == (int)BlockType.TRIGGER)
                {

                    var parentEntityId = parentAction.Entity;
                    var parentEntity = GameState.CurrentEntities[parentEntityId];
                    if (parentEntity.HasDredge())
                    {
                        var lastAffectedByEntity = GameState.CurrentEntities.ContainsKey(parentEntityId)
                            ? GameState.CurrentEntities[parentEntityId]
                            : null;
                        return new List<GameEventProvider> { GameEventProvider.Create(
                            showEntity.TimeStamp,
                            "CARD_DREDGED",
                            GameEvent.CreateProvider(
                                "CARD_DREDGED",
                                cardId,
                                controllerId,
                                entity.Id,
                                StateFacade,
                                //gameState,
                                new {
                                    DredgedByEntityId = parentEntityId,
                                    DredgedByCardId = lastAffectedByEntity?.CardId,
                                }),
                            true,
                            node) };
                    }
                }
            }

            var creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;

            if (cardId == CardIds.PhotographerFizzle_FizzlesSnapshotToken && entity != null && entity.KnownEntityIds.Count == 0)
            {
                entity.KnownEntityIds = GameState.CurrentEntities.Values
                    .Where(e => e.GetController() == entity.GetController())
                    .Where(e => e.InHand())
                    .OrderBy(e => e.GetZonePosition())
                    .Select(e => e.Entity)
                    .ToList();
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "CARD_CHANGED_IN_DECK",
                GameEvent.CreateProvider(
                    "CARD_CHANGED_IN_DECK",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        SubSpell = showEntity.SubSpellInEffect?.Prefab,
                    }),
                true,
                node) };
        }
    }
}
