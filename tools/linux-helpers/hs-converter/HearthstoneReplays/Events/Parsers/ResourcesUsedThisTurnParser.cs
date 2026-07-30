using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class ResourcesUsedThisTurnParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ResourcesUsedThisTurnParser(ParserState ParserState, StateFacade facade)
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
                && ((tagChange = node.Object as TagChange).Name == (int)GameTag.RESOURCES_USED
                    || tagChange.Name == (int)GameTag.TEMP_RESOURCES
                    || tagChange.Name == (int)GameTag.RESOURCES);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            if (ParserState.IsBattlegrounds() && ParserState.InCombatPhase())
            {
                return null;
            }

            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities[tagChange.Entity];
            if (entity.CardId == CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE)
            {
                return null;
            }

            var resourcesUsed = tagChange.Name == (int)GameTag.RESOURCES_USED ? tagChange.Value : entity.GetTag(GameTag.RESOURCES_USED, 0);
            var tempResources = tagChange.Name == (int)GameTag.TEMP_RESOURCES ? tagChange.Value : entity.GetTag(GameTag.TEMP_RESOURCES, 0);
            var totalResources = tagChange.Name == (int)GameTag.RESOURCES ? tagChange.Value : entity.GetTag(GameTag.RESOURCES, 0);
            var resourcesLeft = totalResources + tempResources - resourcesUsed;
            var controllerId = entity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "RESOURCES_UPDATED",
                GameEvent.CreateProvider(
                    "RESOURCES_UPDATED",
                    null,
                    controllerId,
                    entity.Id,
                    StateFacade,
                    //gameState,
                    new {
                        ResourcesTotal = totalResources + tempResources,
                        ResourcesUsed = resourcesUsed,
                        ResourcesLeft = resourcesLeft,
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
