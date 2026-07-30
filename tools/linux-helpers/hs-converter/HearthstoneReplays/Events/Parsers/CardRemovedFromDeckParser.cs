using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using System.Linq;
using HearthstoneReplays.Parser.ReplayData.Meta;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardRemovedFromDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardRemovedFromDeckParser(ParserState ParserState, StateFacade facade)
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
                && (tagChange = node.Object as TagChange).Name == (int)GameTag.ZONE
                // Patchwerk puts the destroyed minion in the Graveyard. I think this is a bug, 
                // but for now that's how it is
                && (tagChange.Value == (int)Zone.SETASIDE || tagChange.Value == (int)Zone.GRAVEYARD)
                // Because of Rewind, can be null
                && GameState.CurrentEntities.GetValueOrDefault((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) == (int)Zone.DECK;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var appliesToShowEntity = node.Type == typeof(ShowEntity)
                && ((node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                        // Army of the Dead for instance sets the zone to the graveyard
                        || (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD)
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            var appliesToFullEntity = node.Type == typeof(FullEntity)
                && ((node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                        || (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD)
                && GameState.CurrentEntities.ContainsKey((node.Object as FullEntity).Id)
                && GameState.CurrentEntities[(node.Object as FullEntity).Id].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            return stateType == StateType.PowerTaskList
                && (appliesToShowEntity || appliesToFullEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            // Cards here are just created to show the info, then put aside. We don't want to 
            // show them in the "Other" zone, so we just ignore them
            if (tagChange.SubSpellInEffect?.Prefab == "DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX")
            {
                return null;
            }

            var entity = GameState.CurrentEntities[tagChange.Entity];
            var controllerId = entity.GetEffectiveController();
            var isOpponent = controllerId != StateFacade.LocalPlayer?.PlayerId;
            var cardId = isOpponent
                && entity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) == 1
                && entity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
                ? null
                : entity.CardId;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);

            string removedByCardId = null;
            int? removedByEntityId = null;
            if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                removedByCardId = GameState.CurrentEntities.GetValueOrDefault(act.Entity)?.CardId;
                removedByEntityId = act.Entity;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "CARD_REMOVED_FROM_DECK",
                GameEvent.CreateProvider(
                    "CARD_REMOVED_FROM_DECK",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        RemovedByCardId = removedByCardId,
                        RemovedByEntityId = removedByEntityId,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(ShowEntity))
            {
                return CreateEventFromShowEntity(node, node.Object as ShowEntity);
            }
            else if (node.Type == typeof(FullEntity))
            {
                return CreateEventFromFullEntity(node, node.Object as FullEntity);
            }
            return null;
        }

        private List<GameEventProvider> CreateEventFromShowEntity(Node node, ShowEntity showEntity)
        {
            // Check that this is not a "Burned card", as they both manifest by a ShowEntity
            // with a graveyard zone
            // Usually, the burned card meta data info appears after the showEntity,and is 
            // handled via the duplicatePredicate of the BurnedCard provider, but I'm 
            // keeping this here just in case
            string removedByCardId = null;
            int? removedByEntityId = null;
            if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                var cardBurned = act.Data
                    .Where((data) => data.GetType() == typeof(MetaData))
                    .Select((data) => data as MetaData)
                    .Where((meta) => meta.Meta == (int)MetaDataType.BURNED_CARD)
                    .Select((meta) => meta.MetaInfo[0])
                    .Any((info) => info.Entity == showEntity.Entity);
                if (cardBurned)
                {
                    return null;
                }
                removedByCardId = GameState.CurrentEntities.GetValueOrDefault(act.Entity)?.CardId;
                removedByEntityId = act.Entity;
            }

            var controllerId = showEntity.GetEffectiveController();
            var isOpponent = controllerId != StateFacade.LocalPlayer?.PlayerId;
            // Hide opponent's burned card identities when the mill animation is suppressed,
            // as this information shouldn't be known to the local player
            var cardId = isOpponent
                && showEntity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) == 1
                && showEntity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
                ? null
                : showEntity.CardId;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "CARD_REMOVED_FROM_DECK",
                GameEvent.CreateProvider(
                    "CARD_REMOVED_FROM_DECK",
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        // Needed to properly remove the Dragons created by Prestor when we play Kazalusan afterwards
                        Cost = showEntity.GetCost(),
                        RemovedByCardId = removedByCardId,
                        RemovedByEntityId = removedByEntityId,
                    }),
                true,
                node) };
        }

        private List<GameEventProvider> CreateEventFromFullEntity(Node node, FullEntity fullEntity)
        {
            if (node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action))
            {
                var act = node.Parent.Object as Parser.ReplayData.GameActions.Action;
                var cardBurned = act.Data
                    .Where((data) => data.GetType() == typeof(MetaData))
                    .Select((data) => data as MetaData)
                    .Where((meta) => meta.Meta == (int)MetaDataType.BURNED_CARD)
                    .Select((meta) => meta.MetaInfo[0])
                    .Any((info) => info.Entity == fullEntity.Id);
                if (cardBurned)
                {
                    return null;
                }
            }

            var controllerId = fullEntity.GetEffectiveController();
            var isOpponent = controllerId != StateFacade.LocalPlayer?.PlayerId;
            var cardId = isOpponent
                && fullEntity.GetTag(GameTag.SUPPRESS_MILL_ANIMATION) == 1
                && fullEntity.GetTag(GameTag.IGNORE_SUPPRESS_MILL_ANIMATION) <= 0
                ? null
                : fullEntity.CardId;
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "CARD_REMOVED_FROM_DECK",
                GameEvent.CreateProvider(
                    "CARD_REMOVED_FROM_DECK",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade
                    //gameState
                    ),
                true,
                node) };
        }
    }
}
