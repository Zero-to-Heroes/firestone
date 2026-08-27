using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardDrawFromDeckParser : ActionParser
    {
        private static List<string> SHOULD_USE_ADVANCED_PREDICTION_FOR_CARD_DRAW = new List<string>() {
            CardIds.SuspiciousAlchemist_AMysteryEnchantment,
            CardIds.DeathBlossomWhomper,
            CardIds.Mimicry_EDR_522,
        };
        private static List<string> SHOULD_USE_ORACLE_TO_IDENTIFY_DRAWN_CARD = new List<string>() {
            CardIds.TalanjiOfTheGraves_TIME_619
        };
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardDrawFromDeckParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ZONE
                && (node.Object as TagChange).Value == (int)Zone.HAND
                && (GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK
                    || GameState.CurrentEntities[(node.Object as TagChange).Entity].GetTag(GameTag.ZONE) == -1);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var appliesToShowEntity = node.Type == typeof(ShowEntity)
                && (node.Object as ShowEntity).GetTag(GameTag.ZONE) == (int)Zone.HAND
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            var appliesToFullEntity = node.Type == typeof(FullEntity)
                && (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.HAND
                && GameState.CurrentEntities.ContainsKey((node.Object as FullEntity).Id)
                && GameState.CurrentEntities[(node.Object as FullEntity).Id].GetTag(GameTag.ZONE) == (int)Zone.DECK;
            return stateType == StateType.PowerTaskList
                && (appliesToShowEntity || appliesToFullEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entityId = tagChange.Entity;
            var entity = GameState.CurrentEntities[entityId];
            var cardId = entity.CardId;
            // When a card is sent back to the deck using tradeable, we know its card ID
            // We can't simply remove the card ID when the card is sent back to the deck, because this would lead to
            // a desynch between HS's game state and our own game state, which can then cause further problems down 
            // the line that can be hard to debug
            // So we need to know, here, if the cardId should be public or not
            // About using "REVEALED": if a card is set to REVEALED = 0, then drawn in a context where we should know what 
            // it is (eg for your own cards), we don't want to hide the info
            // About using "IS_USING_TRADE


            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            // If we compute this when triggering the event, we will get a "gift" icon because the 
            // card is already in hand
            var wasInDeck = entity.GetTag(GameTag.ZONE) == (int)Zone.DECK;
            // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
            // have a special rule
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;
            if (isBeforeMulligan && cardId == CardIds.EncumberedPackMule)
            {
                return null;
            }

            var debug = entityId == 40;
            var dataTag1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
            // Cost is needed for cards like Lady Prestor, which use the cost of the drawn card to remove the right card from the deck
            var cost = entity.GetCost();

            var parentAction = node.Parent.Object.GetType() == typeof(Action) ? node.Parent.Object as Action : null;
            // Useful for Finley
            string drawnByCardId = null;
            int? drawnByEntityId = null;
            bool isTrade = false;
            bool isCastsWhenDrawnReplacementDraw = false;
            if (parentAction != null)
            {
                var drawerEntityId = parentAction.Entity;
                var drawerEntity = GameState.CurrentEntities.GetValueOrDefault(drawerEntityId);
                isTrade = drawerEntity?.GetTag(GameTag.TRADEABLE) == 1 && drawerEntity?.GetTag(GameTag.IS_USING_TRADE_OPTION) == 1;
                isCastsWhenDrawnReplacementDraw = parentAction.Type == (int)BlockType.TRIGGER
                    && (parentAction.TriggerKeyword == (int)GameTag.CASTS_WHEN_DRAWN
                        || parentAction.TriggerKeyword == (int)GameTag.TOPDECK
                        || parentAction.TriggerKeyword == (int)GameTag.SUMMONED_WHEN_DRAWN);
                if (!isTrade && !isCastsWhenDrawnReplacementDraw)
                {
                    drawnByCardId = drawerEntity?.CardId;
                    drawnByEntityId = parentAction.Entity;
                }
            }

            int? createdIndex = null;
            if (drawnByEntityId != null)
            {
                var drawnByEntity = GameState.CurrentEntities.GetValueOrDefault(drawnByEntityId.Value);
                createdIndex = drawnByEntity.CreatedIndex;
                drawnByEntity.CreatedIndex++;
            }
            var revealed = entity.GetTag(GameTag.REVEALED) == 1;
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "CARD_DRAW_FROM_DECK",
                () => {
                    // We do it here because of Keymaster Alabaster - we need to know the last card
                    // that has been drawn
                    // TODO: this was true when relying on the GS logs. Now that we use PTL, maybe we can move this back? Or maybe we 
                    // need the full BLOCK to be complete first?
                    // Reply: yes this is still important, as sometimes we need to have the full BLOCK info to figure out what the card id is
                    var creator = wasInDeck ? null : Oracle.FindCardCreator(GameState, entity, node, false);
                    // Always return this info, and the client has a list of public card creators they are allowed to show
                    var lastInfluencedByCard = Oracle.FindCardCreator(GameState, entity, node);
                    var lastInfluencedByCardId = (isTrade || isCastsWhenDrawnReplacementDraw) ? null : lastInfluencedByCard?.Item1;
                    var predictedCardId = Oracle.PredictCardId(GameState, creator?.Item1, -1, node, cardId, StateFacade);
                    if(SHOULD_USE_ORACLE_TO_IDENTIFY_DRAWN_CARD.Contains(drawnByCardId))
                    {
                        predictedCardId = predictedCardId
                            ?? Oracle.PredictCardId(GameState, drawnByCardId, drawnByEntityId ?? -1, node, cardId, StateFacade, entityId);
                    }
                    // Issue: if a card creates a card and draws one, this will flag them both (while the draw could be something else)
                    // This was introduced to flag the cards created by the Suspicious* cards
                    if (SHOULD_USE_ADVANCED_PREDICTION_FOR_CARD_DRAW.Contains(lastInfluencedByCardId))
                    {
                        predictedCardId = predictedCardId
                            ?? Oracle.PredictCardId(GameState, lastInfluencedByCardId, lastInfluencedByCard?.Item2 ?? -1, node, cardId, StateFacade, entityId);
                    }
                    GameState.OnCardDrawn(entity.Entity);
                    var finalCardId = cardId != null && cardId.Length > 0 ? cardId : predictedCardId;
                    var shouldObfuscate = Obfuscator.shouldObfuscateCardDraw(entity, GameState, node, controllerId == StateFacade.LocalPlayer.PlayerId, revealed: revealed);
                    return new GameEvent
                    {
                        Type =  "CARD_DRAW_FROM_DECK",
                        Value = new
                        {
                            CardId = shouldObfuscate ? null : finalCardId,
                            ControllerId = controllerId,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            EntityId = entity.Id,
                            //GameState = gameState,
                            AdditionalProps = new {
                                IsPremium = shouldObfuscate ? false : entity.GetTag(GameTag.PREMIUM) == 1,
                                CreatorCardId = shouldObfuscate ? null : creator?.Item1,
                                CreatorEntityId = shouldObfuscate ? null : creator?.Item2,
                                CreatedIndex = createdIndex,
                                LastInfluencedByCardId = shouldObfuscate ? null : lastInfluencedByCardId,
                                DataTag1 = shouldObfuscate ? 0 : dataTag1,
                                Cost = shouldObfuscate ? 0 : cost,
                                DrawnByCardId = drawnByCardId,
                                DrawnByEntityId = drawnByEntityId,
                                Tags = entity.GetTagsCopy(),
                            }
                        }
                    };
                },
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(ShowEntity))
            {
                return CreateEventFromShowEntity(node.Object as ShowEntity, node);
            }
            else if (node.Type == typeof(FullEntity))
            {
                return CreateEventFromFullEntity(node.Object as FullEntity, node);
            }
            return null;
        }

        private List<GameEventProvider> CreateEventFromShowEntity(ShowEntity showEntity, Node node)
        {
            var cardId = showEntity.CardId;
            var controllerId = showEntity.GetEffectiveController();
            var entity = GameState.CurrentEntities[showEntity.Entity];
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            var wasInDeck = entity.GetTag(GameTag.ZONE) == (int)Zone.DECK;
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;

            var dataTag1 = entity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
            var cost = showEntity.GetCost();
            var parentAction = node.Parent.Object.GetType() == typeof(Action) ? node.Parent.Object as Action : null;
            // Useful for Finley
            string drawnByCardId = null;
            int? drawnByEntityId = null;
            bool isCastsWhenDrawnReplacementDraw = false;
            if (parentAction != null)
            {
                var drawerEntityId = parentAction.Entity;
                var drawerEntity = GameState.CurrentEntities.GetValueOrDefault(drawerEntityId);
                isCastsWhenDrawnReplacementDraw = parentAction.Type == (int)BlockType.TRIGGER
                    && (parentAction.TriggerKeyword == (int)GameTag.CASTS_WHEN_DRAWN
                        || parentAction.TriggerKeyword == (int)GameTag.TOPDECK
                        || parentAction.TriggerKeyword == (int)GameTag.SUMMONED_WHEN_DRAWN);
                if (!isCastsWhenDrawnReplacementDraw)
                {
                    drawnByCardId = drawerEntity?.CardId;
                    drawnByEntityId = parentAction.Entity;
                }
            }

            int? createdIndex = null;
            if (drawnByEntityId != null)
            {
                var drawnByEntity = GameState.CurrentEntities.GetValueOrDefault(drawnByEntityId.Value);
                createdIndex = drawnByEntity.CreatedIndex;
                drawnByEntity.CreatedIndex++;
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                "CARD_DRAW_FROM_DECK",
                () => {
                    // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
                    // have a special rule to hide it when the opponent draws it
                    if (isBeforeMulligan && cardId == CardIds.EncumberedPackMule && controllerId != StateFacade.LocalPlayer.PlayerId)
                    {
                        return null;
                    }
                    // We do it here because of Keymaster Alabaster - we need to know the last card
                    // that has been drawn
                    var creatorCardId = wasInDeck ? null : Oracle.FindCardCreatorCardId(GameState, showEntity, node);
                    var lastInfluencedByCardId = isCastsWhenDrawnReplacementDraw ? null : Oracle.FindCardCreatorCardId(GameState, showEntity, node);
                    GameState.OnCardDrawn(showEntity.Entity);
                    return new GameEvent
                    {
                        Type =  "CARD_DRAW_FROM_DECK",
                        Value = new
                        {
                            CardId = cardId,
                            ControllerId = controllerId,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            EntityId = showEntity.Entity,
                            //GameState = gameState,
                            AdditionalProps = new {
                                IsPremium = entity.GetTag(GameTag.PREMIUM) == 1 || showEntity.GetTag(GameTag.PREMIUM) == 1,
                                CreatorCardId = creatorCardId?.Item1,
                                CreatorEntityId = creatorCardId?.Item2,
                                CreatedIndex = createdIndex,
                                LastInfluencedByCardId = lastInfluencedByCardId?.Item1,
                                DataTag1 = dataTag1,
                                Cost = cost,
                                DrawnByCardId = drawnByCardId,
                                DrawnByEntityId = drawnByEntityId,
                                Tags = entity.GetTagsCopy(),
                            }
                        }
                    };
                },
                true,
                node) };
        }

        private List<GameEventProvider> CreateEventFromFullEntity(FullEntity fullEntity, Node node)
        {
            var cardId = fullEntity.CardId;
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var wasInDeck = fullEntity.GetTag(GameTag.ZONE) == (int)Zone.DECK;
            // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
            // have a special rule
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;
            if (isBeforeMulligan && cardId == CardIds.EncumberedPackMule)
            {
                cardId = "";
            }

            var dataTag1 = fullEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1, 0);
            var cost = fullEntity.GetCost();
            var parentAction = node.Parent.Object.GetType() == typeof(Action) ? node.Parent.Object as Action : null;
            // Useful for Finley
            string drawnByCardId = null;
            int? drawnByEntityId = null;
            bool isCastsWhenDrawnReplacementDraw = false;
            if (parentAction != null)
            {
                var drawerEntityId = parentAction.Entity;
                var drawerEntity = GameState.CurrentEntities.GetValueOrDefault(drawerEntityId);
                isCastsWhenDrawnReplacementDraw = parentAction.Type == (int)BlockType.TRIGGER
                    && (parentAction.TriggerKeyword == (int)GameTag.CASTS_WHEN_DRAWN
                        || parentAction.TriggerKeyword == (int)GameTag.TOPDECK
                        || parentAction.TriggerKeyword == (int)GameTag.SUMMONED_WHEN_DRAWN);
                if (!isCastsWhenDrawnReplacementDraw)
                {
                    drawnByCardId = drawerEntity?.CardId;
                    drawnByEntityId = parentAction.Entity;
                }
            }

            int? createdIndex = null;
            if (drawnByEntityId != null)
            {
                var drawnByEntity = GameState.CurrentEntities.GetValueOrDefault(drawnByEntityId.Value);
                createdIndex = drawnByEntity.CreatedIndex;
                drawnByEntity.CreatedIndex++;
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "CARD_DRAW_FROM_DECK",
                () => {
                    // We do it here because of Keymaster Alabaster - we need to know the last card
                    // that has been drawn
                    var creator = wasInDeck ? null : Oracle.FindCardCreator(GameState, fullEntity, node, false);
                    var lastInfluencedByCardId = isCastsWhenDrawnReplacementDraw ? null : Oracle.FindCardCreator(GameState, fullEntity, node)?.Item1;
                    GameState.OnCardDrawn(fullEntity.Entity);
                    return new GameEvent
                    {
                        Type =  "CARD_DRAW_FROM_DECK",
                        Value = new
                        {
                            CardId = cardId,
                            ControllerId = controllerId,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            EntityId = fullEntity.Entity,
                            //GameState = gameState,
                            AdditionalProps = new {
                                IsPremium = fullEntity.GetTag(GameTag.PREMIUM) == 1 || fullEntity.GetTag(GameTag.PREMIUM) == 1,
                                CreatorCardId = creator?.Item1,
                                CreatorEntityId = creator?.Item2,
                                CreatedIndex = createdIndex,
                                LastInfluencedByCardId = lastInfluencedByCardId,
                                DataTag1 = dataTag1,
                                Cost = cost,
                                DrawnByCardId = drawnByCardId,
                                DrawnByEntityId = drawnByEntityId,
                                Tags = fullEntity.GetTagsCopy(),
                            }
                        }
                    };
                },
                true,
                node) };
        }
    }
}
