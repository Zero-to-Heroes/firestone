using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class CreateCardInDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CreateCardInDeckParser(ParserState ParserState, StateFacade facade)
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
            // In this case, a FullEntity is created with minimal info, and the real
            // card creation happens in the ShowEntity
            var appliesOnShowEntity = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.DECK;
            var appliesOnFullEntity = node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.DECK
                // We don't want to include the entities created when the game starts
                && node.Parent.Type == typeof(Parser.ReplayData.GameActions.Action);
            var debug = appliesOnFullEntity && (node.Object as FullEntity).Entity == 181;
            return stateType == StateType.PowerTaskList
                && (appliesOnShowEntity || appliesOnFullEntity);
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
            else if (node.Type == typeof(FullEntity))
            {
                return CreateFromFullEntity(node);
            }
            return null;
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

            var currentCard = GameState.CurrentEntities[showEntity.Entity];
            // If the card is already present in the deck, do nothing
            if (currentCard.GetTag(GameTag.ZONE) == (int)Zone.DECK)
            {
                return null;
            }

            var creator = Oracle.FindCardCreatorCardId(GameState, showEntity, node);
            var cardId = Oracle.PredictCardId(GameState, creator.Item1, creator.Item2, node, showEntity.CardId);
            var controllerId = showEntity.GetEffectiveController();
            // Info leak
            if (node.Parent?.Object is Action)
            {
                var parentAction = node.Parent.Object as Action;
                var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                if (parentEntity?.CardId == CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e)
                {
                    cardId = null;
                }
            }


            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "CREATE_CARD_IN_DECK",
                GameEvent.CreateProvider(
                    "CREATE_CARD_IN_DECK",
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creator?.Item1, // Used when there is no cardId, so we can show at least the card that created it
                        CreatorEntityId = creator?.Item2 ?? -1,
                        // Used by Souleater's Scythe's Bound Souls to refer to the bound minion
                        FxDataNum1 = showEntity.GetTag(GameTag.FX_DATANUM_1),
                    }),
                true,
                node) };
        }

        private List<GameEventProvider> CreateFromFullEntity(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            // Cards here are just created to show the info, then put aside. We don't want to 
            // show them in the "Other" zone, so we just ignore them
            if (fullEntity.SubSpellInEffect?.Prefab == "DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX")
            {
                return null;
            }

            var parentAction = node.Parent?.Object as Action;
            bool createdByJoust = parentAction?.Type == (int)BlockType.JOUST;

            var creator = Oracle.FindCardCreator(GameState, fullEntity, node, true, StateFacade);
            if (creator?.Item1 == CardIds.DarkGiftToken_EDR_102t)
            {
                var futureEntity = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(fullEntity.Id);
                if (fullEntity != null)
                {
                    var realGiftCreatorEntityId = futureEntity.TagsHistory.LastOrDefault(t => t.Name == (int)GameTag.TAG_SCRIPT_DATA_ENT_1 && t.Value > 0)?.Value ?? 0;
                    var realGiftCreator = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(realGiftCreatorEntityId);
                    if (realGiftCreator != null)
                    {
                        creator = new Tuple<string, int>(realGiftCreator.CardId, realGiftCreatorEntityId);
                    }
                }
            }
            var cardId = Oracle.PredictCardId(GameState, creator?.Item1, creator?.Item2 ?? -1, node, fullEntity.CardId, this.StateFacade, fullEntity.Entity);
            // The timing for this is super weird, as the entity is created in deck before the Portal triggers
            // Also, according to the devs, it shouldn't even be able to create itself
            // https://x.com/MyntyPhresh/status/1845246521916391798
            if (creator?.Item1 == CardIds.Kiljaeden_GDB_145)
            {
                return null;
            }

            if (cardId == null)
            {
                // Check the GameState in case we know the id, which is typically useful when the card is created empty, then 
                // a CHANGE_ENTITY block is used to set the data
                cardId = StateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(fullEntity.Id)?.CardId;
            }
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);

            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "CREATE_CARD_IN_DECK",
                GameEvent.CreateProvider(
                    "CREATE_CARD_IN_DECK",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creator?.Item1, // Used when there is no cardId, so we can show "created by ..."
                        CreatorEntityId = creator?.Item2 ?? -1,
                        CreatedByJoust = createdByJoust,
                        // Used by Souleater's Scythe's Bound Souls to refer to the bound minion
                        FxDataNum1 = fullEntity.GetTag(GameTag.FX_DATANUM_1),
                    }),
                true,
                node) };
        }
    }
}
