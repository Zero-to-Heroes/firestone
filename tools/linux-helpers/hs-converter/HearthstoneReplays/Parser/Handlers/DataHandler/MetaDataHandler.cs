using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser.ReplayData;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Events;
using HearthstoneReplays.Parser.ReplayData.Meta;

namespace HearthstoneReplays.Parser.Handlers
{
    internal class MetaDataHandler
    {
        public static bool HandleMetaData(DateTime timestamp, string data, ParserState state, StateType stateType, GameMetaData metadata, Helper helper)
        {
            // Early checks before running regex
            if (data.Contains("BuildNumber="))
            {
                System.Text.RegularExpressions.Match match = Regexes.BuildNumber.Match(data);
                if (match.Success)
                {
                    metadata.BuildNumber = int.Parse(match.Groups[1].Value);
                    state.CurrentGame.BuildNumber = metadata.BuildNumber;
                    return true;
                }
            }

            if (data.Contains("GameType="))
            {
                var match = Regexes.GameType.Match(data);
                if (match.Success)
                {
                    var rawGameType = match.Groups[1].Value;
                    var gameType = helper.ParseEnum<GameType>(rawGameType);
                    metadata.GameType = gameType;
                    // We need to assign it right now, otherwise we can't use the meta data while 
                    // doing the logic for player assignments, which is needed for mercenaries
                    state.CurrentGame.GameType = metadata.GameType;
                    return true;
                }
            }

            if (data.Contains("FormatType="))
            {
                var match = Regexes.FormatType.Match(data);
                if (match.Success)
                {
                    var rawFormatType = match.Groups[1].Value;
                    var formatType = helper.ParseEnum<FormatType>(rawFormatType);
                    metadata.FormatType = formatType;
                    state.CurrentGame.FormatType = metadata.FormatType;
                    return true;
                }
            }

            if (data.Contains("ScenarioID="))
            {
                var match = Regexes.ScenarioID.Match(data);
                if (match.Success)
                {
                    metadata.ScenarioID = int.Parse(match.Groups[1].Value);
                    state.CurrentGame.ScenarioID = metadata.ScenarioID;
                    if (stateType == StateType.GameState)
                    {
                        state.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { GameEventProvider.Create(
                            timestamp,
                            "MATCH_METADATA",
                            () => {
                                state.CurrentGame.BuildNumber = metadata.BuildNumber;
                                state.CurrentGame.GameType = metadata.GameType;
                                state.CurrentGame.FormatType = metadata.FormatType;
                                //state.CurrentGame.ScenarioID = metadata.ScenarioID;
                                state.GameState.MetaData = metadata;
                                return new GameEvent
                                {
                                    Type = "MATCH_METADATA",
                                    Value = new {
                                        MetaData = metadata,
                                        Spectating = state.Spectating,
                                    }
                                };
                            },
                            false,
                            new Node(null, null, 0, null, data)) });
                    }

                    return true;
                }
            }
            return false;
        }
    }
}