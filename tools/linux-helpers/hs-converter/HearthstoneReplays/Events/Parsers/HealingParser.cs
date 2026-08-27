using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData.Meta;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using System.Linq;

namespace HearthstoneReplays.Events.Parsers
{
    public class HealingParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade Helper { get; set; }

        public HealingParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.Helper = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(Parser.ReplayData.GameActions.Action)
                && HashHealingTag(node.Object as Parser.ReplayData.GameActions.Action);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var action = node.Object as Parser.ReplayData.GameActions.Action;
            var healingTags = action.Data
                .Where((d) => d.GetType() == typeof(MetaData))
                .Select((meta) => meta as MetaData)
                .Where((meta) => meta.Meta == (int)MetaDataType.HEALING);
            Dictionary<string, Dictionary<string, HealingInternal>> totalHealings = new Dictionary<string, Dictionary<string, HealingInternal>>();
            foreach (var healingTag in healingTags)
            {
                foreach (var info in healingTag.MetaInfo)
                {
                    // If source or target are player entities, they don't have any 
                    // attached cardId
                    var healingTarget = GameState.CurrentEntities[info.Entity];
                    var targetEntityId = healingTarget.Id;
                    var targetCardId = GameState.GetCardIdForEntity(healingTarget.Id);
                    var targetControllerId = healingTarget.GetEffectiveController();
                    var healingSource = GetHealingSource(healingTarget, action, healingTag);
                    var sourceEntityId = healingSource.Id;
                    var sourceCardId = GameState.GetCardIdForEntity(healingSource.Id);
                    var sourceControllerId = healingSource.GetEffectiveController();
                    Dictionary<string, HealingInternal> currentSourceHealings = null;
                    if (totalHealings.ContainsKey(sourceCardId))
                    {
                        currentSourceHealings = totalHealings[sourceCardId];
                    }
                    else
                    {
                        currentSourceHealings = new Dictionary<string, HealingInternal>();
                        totalHealings[sourceCardId] = currentSourceHealings;
                    }
                    HealingInternal currentTargetHealings = null;
                    if (currentSourceHealings.ContainsKey(targetCardId))
                    {
                        currentTargetHealings = currentSourceHealings[targetCardId];
                    }
                    else
                    {
                        currentTargetHealings = new HealingInternal
                        {
                            SourceEntityId = sourceEntityId,
                            SourceControllerId = sourceControllerId,
                            TargetEntityId = targetEntityId,
                            TargetControllerId = targetControllerId,
                            Healing = 0,
                            Timestamp = info.TimeStamp,
                        };
                        currentSourceHealings[targetCardId] = currentTargetHealings;
                    }
                    currentTargetHealings.Healing = currentTargetHealings.Healing + healingTag.Data;
                }
            }

            List<GameEventProvider> result = new List<GameEventProvider>();
            // Now send one event per source
            foreach (var healingSource in totalHealings.Keys)
            {
                var targetHealings = totalHealings[healingSource];
                var timestamp = totalHealings[healingSource].First().Value.Timestamp;
                result.Add(GameEventProvider.Create(
                    timestamp,
                    "HEALING",
                    // The structure of this event is too specific to be added to the generic GameEvent.CreateProvider() method
                    () => new GameEvent
                    {
                        Type = "HEALING",
                        Value = new
                        {
                            SourceCardId = healingSource,
                            SourceEntityId = totalHealings[healingSource].First().Value.SourceEntityId,
                            SourceControllerId = totalHealings[healingSource].First().Value.SourceControllerId,
                            Targets = totalHealings[healingSource],
                            LocalPlayer = Helper.LocalPlayer,
                            OpponentPlayer = Helper.OpponentPlayer,
                        }
                    },
                    true,
                    node));
            }

            return result;
        }

        private bool HashHealingTag(Parser.ReplayData.GameActions.Action action)
        {
            var data = action.Data;
            var numberOfHealingTags = data
                .Where((d) => d.GetType() == typeof(MetaData))
                .Where((meta) => (meta as MetaData).Meta == (int)MetaDataType.HEALING)
                .Count();
            return numberOfHealingTags > 0;
        }

        private FullEntity GetHealingSource(FullEntity target, Parser.ReplayData.GameActions.Action action, MetaData meta)
        {
            var actionSource = GameState.CurrentEntities[action.Entity];
            return actionSource;
        }

        private class HealingInternal
        {
            public int SourceEntityId;
            public int SourceControllerId;
            public int TargetEntityId;
            public int TargetControllerId;
            public int Healing;
            public DateTime Timestamp;
        }
    }
}
