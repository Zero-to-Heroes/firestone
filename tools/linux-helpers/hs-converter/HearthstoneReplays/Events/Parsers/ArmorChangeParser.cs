using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class ArmorChangeParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ArmorChangeParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (node.Object as TagChange).Name == (int)GameTag.ARMOR;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (entity == null)
            {
                return null;
            }

            // When playing a hero card, the ARMOR tag changes on the card itself, but we're actually interested
            // only in changes to the hero's armor
            if (!StateFacade.IsBattlegrounds())
            {
                var controller = entity.GetController();
                var playerEntity = ParserState.GetPlayerForController(controller);
                var fullEntity = GameState.CurrentEntities.GetValueOrDefault(playerEntity.Id);
                var heroEntity = fullEntity.GetTag(GameTag.HERO_ENTITY);
                if (heroEntity != tagChange.Entity)
                {
                    return null;
                }
            }

            // TODO: also indicate whether you're paying with your armor
            var initialArmor = entity.GetTag(GameTag.ARMOR, 0);
            var newArmor = tagChange.Value;
            var cardId = entity.CardId;
            var controllerId = entity.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                 "ARMOR_CHANGED",
                GameEvent.CreateProvider(
                    "ARMOR_CHANGED",
                    cardId,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //null,
                    new {
                        PlayerId = entity.GetTag(GameTag.PLAYER_ID),
                        ArmorChange = newArmor - initialArmor,
                        TotalArmor = newArmor,
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
