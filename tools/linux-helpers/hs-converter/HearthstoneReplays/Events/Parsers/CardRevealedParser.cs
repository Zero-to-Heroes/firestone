using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class CardRevealedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public CardRevealedParser(ParserState ParserState, StateFacade facade)
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
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(FullEntity)
                && ((node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                // Nagaling
                || (node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.REMOVEDFROMGAME);
            // I don't remember why the card type was restricted to minions
            // But it makes sense to have it for all card types. In the case of Spy-o-matic, the
            // spells that are discovered otherwise don't appear in the deck
            //&& (node.Object as FullEntity).GetTag(GameTag.CARDTYPE) == (int)CardType.MINION;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var fullEntity = node.Object as FullEntity;
            var cardId = fullEntity.CardId;
            var controllerId = fullEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, null);
            var creatorEntityId = fullEntity.GetTag(GameTag.CREATOR);
            var creatorEntity = GameState.CurrentEntities.ContainsKey(creatorEntityId)
                ? GameState.CurrentEntities[creatorEntityId]
                : null;
            FullEntity originEntity = null;
            if (node.Parent?.Object is Action)
            {
                var influencerEntityId = (node.Parent.Object as Action).Entity;
                originEntity = GameState.CurrentEntities.GetValueOrDefault(influencerEntityId);
            }
            var creatorEntityCardId = creatorEntity?.CardId;
            var originEntityCardId = originEntity?.CardId;
            // For now the only case where the card is created in the REMOVEDFROMGAME zone instead of SETASIDE is 
            // Nagaling. This might change in the future, but to avoid sending unwanted events, we add this guard 
            // clause for now
            if (fullEntity.GetZone() == (int)Zone.REMOVEDFROMGAME && creatorEntityCardId != CardIds.SchoolTeacher_NagalingToken)
            {
                return null;
            }

            var mercXp = fullEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
            var mercEquipmentId = fullEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
            string revealedFromBlock = null;
            int? indexInBlock = null;
            if (node.Parent != null && node.Parent.Object.GetType() == typeof(Action))
            {
                var parentAction = node.Parent.Object as Action;
                var parentEntityId = parentAction.Entity;
                var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                // Check that 3 options were provided
                var totalOptions = parentAction.Data
                    .Where(data => data is FullEntity)
                    .Count();
                indexInBlock = parentAction.Data
                    .Where(data => data is FullEntity)
                    .Select(data => data as FullEntity)
                    .Select(e => e.Entity)
                    .ToList()
                    .IndexOf(fullEntity.Id);
                if (parentEntity?.HasDredge() ?? false)
                {
                    revealedFromBlock = "DREDGE";
                }
                if (parentEntity?.CardId == CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e)
                {
                    cardId = "";
                }
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "CARD_REVEALED",
                GameEvent.CreateProvider(
                    "CARD_REVEALED",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        OriginEntityCardId = originEntityCardId,
                        MercenariesExperience = mercXp,
                        MercenariesEquipmentId = mercEquipmentId,
                        RevealedFromBlock = revealedFromBlock,
                        IndexInBlock = indexInBlock,
                        Cost = fullEntity.GetCost(),
                        Tags = fullEntity.GetTagsCopy(),
                    }
                ),
                true,
                node) };
        }
    }
}
