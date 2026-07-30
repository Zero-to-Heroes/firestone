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
    public class CardBackToDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardBackToDeckParser(ParserState ParserState, StateFacade helper)
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
                && (node.Object as TagChange).Value == (int)Zone.DECK
                && !IsTrade(node.Parent);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            var zoneInt = entity.GetTag(GameTag.ZONE) == -1 ? 0 : entity.GetTag(GameTag.ZONE);
            var initialZone = ((Zone)zoneInt).ToString();
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);

            var parentAction = node.Parent?.Object as Action;
            int? influencedByEntityId = null;
            string influencedByCardId = null;
            var cardId = entity.CardId;
            if (parentAction != null && 
                // Bottomfeeder uses TRIGGER
                (parentAction.Type == (int)BlockType.POWER || parentAction.Type == (int)BlockType.TRIGGER))
            {
                var influenceEntity = GameState.CurrentEntities[parentAction.Entity];
                influencedByEntityId = influenceEntity?.Entity;
                influencedByCardId = influenceEntity?.CardId;
                // Info leak
                if (influencedByCardId == CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e)
                {
                    cardId = null;
                }
            }

            if (cardId == null || cardId.Length == 0)
            {
                var creator = Oracle.FindCardCreator(GameState, entity, node);
                cardId = Oracle.PredictCardId(GameState, creator?.Item1, creator?.Item2 ?? -1, node, cardId);
            }

            // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
            // have a special rule
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;
            var isOpponentMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == (int)Step.BEGIN_MULLIGAN
                && entity.GetController() == StateFacade.OpponentPlayer.PlayerId;
            if ((isOpponentMulligan || isBeforeMulligan) && cardId == CardIds.EncumberedPackMule)
            {
                cardId = "";
            }

            var eventName = zoneInt == (int)Zone.SETASIDE ? "CREATE_CARD_IN_DECK" : "CARD_BACK_TO_DECK";
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        InitialZone = initialZone,
                        InfluencedByEntityId = influencedByEntityId,
                        InfluencedByCardId = influencedByCardId,
                        CreatorCardId = eventName == "CREATE_CARD_IN_DECK" ? influencedByCardId : null,
                        CreatorEntityId = eventName == "CREATE_CARD_IN_DECK" ? influencedByEntityId : null,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }

        private bool IsTrade(Node node)
        {
            return node?.Type == typeof(Action)
                && (node.Object as Action).Type == (int)BlockType.DECK_ACTION;
        }
    }
}
