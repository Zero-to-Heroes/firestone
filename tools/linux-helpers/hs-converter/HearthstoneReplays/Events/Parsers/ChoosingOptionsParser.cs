using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.Meta;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class ChoosingOptionsParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public ChoosingOptionsParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return node.Type == typeof(Choices) && ParserState.Choices != null;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var choices = node.Object as Choices;
            var sourceEntity = GameState.CurrentEntities.GetValueOrDefault(choices.Source);
            if (sourceEntity == null)
            {
                return null;
            }

            // Dark gifts show the "dark gift" as the source of the choices, instead of the entity that triggers the choices
            var isDarkGift = sourceEntity.CardId == CardIds.DarkGiftToken_EDR_102t;
            if (isDarkGift)
            {
                var creatorEntityId = sourceEntity.GetTag(GameTag.CREATOR);
                var creatorEntity = GameState.CurrentEntities.GetValueOrDefault(creatorEntityId);
                if (creatorEntity != null)
                {
                    sourceEntity = creatorEntity;
                }
            }

            var controllerId = sourceEntity.GetEffectiveController();
            var options = choices.ChoiceList?.Select(c => {
                var optionEntity = GameState.CurrentEntities.GetValueOrDefault(c.Entity);
                // Dark gift
                if (isDarkGift && optionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1) != -1)
                {
                    var referencedEntity = GameState.CurrentEntities.GetValueOrDefault(optionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1));
                    if (referencedEntity != null)
                    {
                        optionEntity = referencedEntity;
                    }
                }
                var rewardEntityId = optionEntity.GetTag(GameTag.TAG_SCRIPT_DATA_ENT_1);
                var rewardEntity = GameState.CurrentEntities.GetValueOrDefault(rewardEntityId);
                var rewardCardId = rewardEntity?.CardId;
                return new
                {
                    EntityId = c.Entity,
                    CardId = optionEntity?.CardId,
                    QuestDifficulty = optionEntity?.GetTag(GameTag.QUEST_PROGRESS_TOTAL, 0),
                    QuestReward = new {
                        EntityId = rewardEntityId,
                        CardId = rewardCardId,
                    }
                };
            })?.ToList();
            if (options == null || options.Count == 0) { 
                return null; 
            }


            return new List<GameEventProvider> { GameEventProvider.Create(
                choices.TimeStamp,
                "CHOOSING_OPTIONS",
                GameEvent.CreateProvider(
                    "CHOOSING_OPTIONS",
                    sourceEntity.CardId,
                    controllerId,
                    sourceEntity.Id,
                    StateFacade,
                    //null,
                    new {
                        Options = options,
                        Context = new
                        {
                            // The current step for Murloc Holmes
                            DataNum1 = sourceEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1),
                        }
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