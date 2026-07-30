using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class BattlegroundsTavernPrizesParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }

        public BattlegroundsTavernPrizesParser(ParserState ParserState)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(GameEntity);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return new List<GameEventProvider> { GameEventProvider.Create(
                    (node.Object as GameEntity).TimeStamp,
                     "GAME_SETTINGS",
                    () => new GameEvent
                    {
                        Type = "GAME_SETTINGS",
                        Value = new {
                             BattlegroundsPrizes = (node.Object as GameEntity).GetTag(GameTag.DARKMOON_FAIRE_PRIZES_ACTIVE) == 1,
                             BattlegroundsSpells = true, // (node.Object as GameEntity).GetTag(GameTag.BACON_SPELLS_ACTIVE) == 1,
                             BattlegroundsQuests = (node.Object as GameEntity).GetTag(GameTag.BACON_QUESTS_ACTIVE) == 1,
                             BattlegroundsBuddies = (node.Object as GameEntity).GetTag(GameTag.BACON_BUDDY_ENABLED) == 1,
                             BattlegroundsTrinkets = (node.Object as GameEntity).GetTag(GameTag.BACON_TRINKETS_ACTIVE) == 1,
                             BattlegroundsAnomalies = new List<int>() { (node.Object as GameEntity).GetTag(GameTag.BACON_GLOBAL_ANOMALY_DBID) },
                             BattlegroundsTimewarped = (node.Object as GameEntity).GetTag(GameTag.BACON_ALT_TAVERN_SYSTEM_ACTIVE) == 1,
                        },
                    },
                    false,
                    node)
                };
        }
    }
}
