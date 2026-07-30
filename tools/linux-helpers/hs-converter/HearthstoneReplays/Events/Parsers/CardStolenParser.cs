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
    public class CardStolenParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardStolenParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.CONTROLLER
                && !MindrenderIlluciaParser.IsProcessingMindrenderIlluciaEffect(node, GameState);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Parser.ReplayData.GameActions.ShowEntity)
                && GameState.CurrentEntities.ContainsKey((node.Object as ShowEntity).Entity)
                && GameState.CurrentEntities[(node.Object as ShowEntity).Entity].GetEffectiveController()
                        != (node.Object as ShowEntity).GetEffectiveController()
                && !MindrenderIlluciaParser.IsProcessingMindrenderIlluciaEffect(node, GameState);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var controllerId = entity.GetEffectiveController();
            var lettuceControllerId = entity.GetTag(GameTag.LETTUCE_CONTROLLER);
            if (tagChange.Value == lettuceControllerId)
            {
                return null;
            }

            if (GameState.CurrentEntities[tagChange.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                var zone = entity.GetZone();
                string stolenByCardId = null;
                int? stolenByEntityId = null;
                if (node.Parent?.Type == typeof(Action))
                {
                    Action parentAction = node.Parent.Object as Action;
                    stolenByEntityId = parentAction.Entity;
                    stolenByCardId = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity)?.CardId;
                }
                // In case the cardId is only revealed later in the block, like with Soul Seeker (the tag change doesn't know
                // the card ID yet)
                // UPDATE 2026-02-24: move this for now; if the card id is revealed in another block we need to handle this 
                // separately, otherwise it can lead to info leaks
                var cardId = entity.CardId;
                return new List<GameEventProvider> { GameEventProvider.Create(
                    tagChange.TimeStamp,
                    "CARD_STOLEN",
                    () => {
                        return new GameEvent
                        {
                            Type =  "CARD_STOLEN",
                            Value = new
                            {
                                CardId = cardId,
                                ControllerId = controllerId,
                                LocalPlayer = StateFacade.LocalPlayer,
                                OpponentPlayer = StateFacade.OpponentPlayer,
                                EntityId = entity.Id,
                                //GameState = gameState,
                                AdditionalProps = new {
                                    newControllerId = tagChange.Value,
                                    zone = zone,
                                    StolenByCardId = stolenByCardId,
                                    StolenByEntityId = stolenByEntityId,
                                }
                            }
                        };
                    },
                    true,
                    node) };
            }
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as Parser.ReplayData.GameActions.ShowEntity;
            var cardId = showEntity.CardId;
            var controllerId = GameState.CurrentEntities[showEntity.Entity].GetEffectiveController();
            var lettuceControllerId = showEntity.GetTag(GameTag.LETTUCE_CONTROLLER);
            if (showEntity.GetEffectiveController() == lettuceControllerId)
            {
                return null;
            }

            if (GameState.CurrentEntities[showEntity.Entity].GetTag(GameTag.CARDTYPE) != (int)CardType.ENCHANTMENT)
            {
                //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
                var zone = showEntity.GetZone();
                return new List<GameEventProvider> { GameEventProvider.Create(
                    showEntity.TimeStamp,
                    "CARD_STOLEN",
                    () => {
                        // For Doommaiden, the stealing enchantment is revealed only after the ShowEntity
                        string stolenByCardId = null;
                        int? stolenByEntityId = null;
                        if (node.Parent?.Type == typeof(Action))
                        {
                            Action parentAction = node.Parent.Object as Action;
                            stolenByEntityId = parentAction.Entity;
                            stolenByCardId = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity)?.CardId;
                        }
                        return new GameEvent
                        {
                            Type =  "CARD_STOLEN",
                            Value = new
                            {
                                CardId = cardId,
                                ControllerId = controllerId,
                                LocalPlayer = StateFacade.LocalPlayer,
                                OpponentPlayer = StateFacade.OpponentPlayer,
                                EntityId = showEntity.Entity,
                                AdditionalProps = new {
                                    newControllerId = showEntity.GetEffectiveController(),
                                    StolenByCardId = stolenByCardId,
                                    StolenByEntityId = stolenByEntityId,
                                    zone = zone,
                                }
                            }
                        };
                    },
                    true,
                    node) };
            }
            return null;
        }
    }
}
