using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class MercenariesHeroRevealed : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public MercenariesHeroRevealed(ParserState ParserState, StateFacade facade)
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
            FullEntity fullEntity;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(FullEntity)
                && (
                    (fullEntity = node.Object as FullEntity).GetTag(GameTag.ZONE) == (int)Zone.SETASIDE
                    || fullEntity.GetTag(GameTag.ZONE) == (int)Zone.PLAY
                    // Mercs that died in previous rounds start the fight in the graveyard, and we still want to show them in PvE at least
                    || fullEntity.GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD)
                && fullEntity.GetTag(GameTag.LETTUCE_MERCENARY) == 1;
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
            var creatorEntityCardId = GameState.CurrentEntities.ContainsKey(creatorEntityId) 
                ? GameState.CurrentEntities[creatorEntityId].CardId
                : null;
            var isDead = fullEntity.GetTag(GameTag.ZONE) == (int)Zone.GRAVEYARD;
            var mercXp = fullEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
            var mercEquipmentId = fullEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
            var zone = fullEntity.GetZone();
            var zonePosition = fullEntity.GetZonePosition();
            return new List<GameEventProvider> { GameEventProvider.Create(
                fullEntity.TimeStamp,
                "MERCENARIES_HERO_REVEALED",
                GameEvent.CreateProvider(
                    "MERCENARIES_HERO_REVEALED",
                    cardId,
                    controllerId,
                    fullEntity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        CreatorCardId = creatorEntityCardId,
                        MercenariesExperience = mercXp,
                        MercenariesEquipmentId = mercEquipmentId,
                        IsDead = isDead,
                        ZonePosition = zonePosition,
                        Zone = zone,
                    }
                ),
                true,
                node) };
        }
    }
}
