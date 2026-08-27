using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.Meta;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class EntityChosenParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public EntityChosenParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return node.Type == typeof(Choice)
                && ParserState.CurrentChosenEntites != null;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var choice = node.Object as Choice;
            // Why use Ptl here? 
            var ptlState = StateFacade.PtlState.GameState;
            var keyInGS = GameState.CurrentEntities.ContainsKey(choice.Entity);
            // Special case for Sphere of Sapience, as the corresponding block is not properly closed
            FullEntity chosenEntity = (ptlState?.CurrentEntities?.ContainsKey(choice.Entity) ?? false)
                ? ptlState.CurrentEntities[choice.Entity]
                : keyInGS
                    ? GameState.CurrentEntities[choice.Entity]
                    : null;
            if (chosenEntity == null)
            {
                return null;
            }

            // Entities offered in chocies are often côpies
            var isCopy = ptlState.CurrentEntities.ContainsKey(chosenEntity.GetTag(GameTag.LINKED_ENTITY));
            var originalEntity = isCopy ? ptlState.CurrentEntities[chosenEntity.GetTag(GameTag.LINKED_ENTITY)] : null;
            var controllerId = chosenEntity.GetEffectiveController();

            return new List<GameEventProvider> { GameEventProvider.Create(
                choice.TimeStamp,
                "ENTITY_CHOSEN",
                () =>
                {
                    var gsChosenEntity = GameState.CurrentEntities.GetValueOrDefault(choice.Entity);
                    // Because when the opponent Discovers, the CREATOR tag is set right AFTER the discover, so we need to wait a little bit
                    var creatorEntityId = gsChosenEntity?.GetTag(GameTag.CREATOR) ?? -1;
                    // When opponent discovers
                    if (creatorEntityId == -1)
                    {
                        creatorEntityId = gsChosenEntity?.GetTag(GameTag.DISPLAYED_CREATOR) ?? -1;
                    }
                    var creatorEntity = ptlState.CurrentEntities.ContainsKey(creatorEntityId) ? ptlState.CurrentEntities[creatorEntityId] : null;
                    var creatorCardId = creatorEntity?.CardId;

                    if (creatorCardId == CardIds.SuspiciousPirate
                        || creatorCardId == CardIds.SuspiciousAlchemist
                        || creatorCardId == CardIds.SuspiciousUsher
                        || creatorCardId == CardIds.SuspiciousPeddler)
                    {
                        creatorEntity.KnownEntityIds.Add(chosenEntity.Id);
                    }

                    return new GameEvent
                    {
                        Type = "ENTITY_CHOSEN",
                        Value = new
                        {
                            CardId = chosenEntity.CardId,
                            ControllerId = controllerId,
                            LocalPlayer = StateFacade.LocalPlayer,
                            OpponentPlayer = StateFacade.OpponentPlayer,
                            EntityId = chosenEntity.Id,
                            AdditionalProps =  new {
                                OriginalEntityId = originalEntity?.Id,
                                Context = new
                                {
                                    CreatorEntityId = creatorEntityId,
                                    CreatorCardId = creatorCardId,
                                }
                            }
                        }
                    };
                },
                true,
                node, 
                null,
                waitFor: 400) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}