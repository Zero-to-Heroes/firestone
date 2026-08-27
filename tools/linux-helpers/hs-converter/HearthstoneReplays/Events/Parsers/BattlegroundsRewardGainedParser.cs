using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsRewardGainedParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsRewardGainedParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && StateFacade.IsBattlegrounds()
                && node.Type == typeof(TagChange)
                && ((node.Object as TagChange).Name == (int)GameTag.BACON_HERO_QUEST_REWARD_COMPLETED
                    // For Denathrius
                    || (node.Object as TagChange).Name == (int)GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_COMPLETED);
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var hero = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            if (hero?.CardId == null)
            {
                return null;
            }

            // TODO: find the reward card id
            var isHeroPowerReward = tagChange.Name == (int)GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_COMPLETED;
            var questRewardDbfId = isHeroPowerReward ? hero.GetTag(GameTag.BACON_HERO_HEROPOWER_QUEST_REWARD_DATABASE_ID) : hero.GetTag(GameTag.BACON_HERO_QUEST_REWARD_DATABASE_ID);

            var controllerId = hero.GetEffectiveController();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "BATTLEGROUNDS_REWARD_GAINED",
                GameEvent.CreateProvider(
                "BATTLEGROUNDS_REWARD_GAINED",
                    hero.CardId,
                    controllerId,
                    hero.Entity,
                    StateFacade,
                    //null,
                    new {
                        PlayerId = hero.GetTag(GameTag.PLAYER_ID),
                        QuestRewardDbfId = questRewardDbfId,
                        IsHeroPowerReward = isHeroPowerReward,
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
