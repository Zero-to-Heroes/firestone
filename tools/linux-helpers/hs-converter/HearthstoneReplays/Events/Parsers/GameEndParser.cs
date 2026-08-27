using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;

namespace HearthstoneReplays.Events.Parsers
{
    public class GameEndParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public GameEndParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            TagChange tagChange = null;
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(TagChange)
                && (
                    ((tagChange = node.Object as TagChange).Name == (int)GameTag.STATE && tagChange.Value == (int)State.COMPLETE)
                    || (ParserState.IsBattlegrounds() && tagChange.Name == (int)GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED && tagChange.Value == 1)
                );
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            Logger.Log("Parsing end game", node.CreationLogLine);
            var tagChange = node.Object as TagChange;
            if (tagChange.Name == (int)GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED)
            {
                var isPlayer = tagChange.Entity == StateFacade.LocalPlayer.Id;
                if (!isPlayer)
                {
                    return null;
                }
            }
            var replayCopy = StateFacade.GSReplay;
            // Update the name info
            foreach (var player in ParserState.getPlayers())
            {
                var gsPlayer = StateFacade.GetPlayers().Find(p => p.Id == player.Id);
                player.Name = gsPlayer?.Name ?? player.Name;
            }
            Logger.Log("Will convert to xml", "");
            var xmlReplay = new ReplayConverter().xmlFromReplay(replayCopy);
            Logger.Log("XML converted", "");
            var gameStateReport = GameState.BuildGameStateReport(StateFacade);
            Logger.Log("gameStateReport built", "");
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, tagChange, null);
            Logger.Log("Enqueuing GAME_END event", "");
            ParserState.EndCurrentGame();
            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "GAME_END",
                () => new GameEvent
                {
                    Type = "GAME_END",
                    Value = new
                    {
                        LocalPlayer = StateFacade.LocalPlayer,
                        OpponentPlayer = StateFacade.OpponentPlayer,
                        GameStateReport = gameStateReport,
                        FormatType = ParserState.CurrentGame.FormatType,
                        GameType = ParserState.CurrentGame.GameType,
                        ScenarioID = ParserState.CurrentGame.ScenarioID,
                        //Game = ParserState.CurrentGame,
                        ReplayXml = xmlReplay,
                        Spectating = StateFacade.Spectating,
                    }
                },
                true,
                node) };
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
