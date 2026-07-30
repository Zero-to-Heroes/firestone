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

namespace HearthstoneReplays.Parser.Handlers
{
    internal class PlayerNameHandler
    {
        public static bool HandlePlayerName(DateTime timestamp, string data, ParserState state, StateType stateType)
        {
            var match = Regexes.PlayerNameAssignment.Match(data);
            if (match.Success)
            {
                var playerId = int.Parse(match.Groups[1].Value);
                var playerName = match.Groups[2].Value;
                try
                {
                    var matchingPlayer = state.getPlayers()
                        .Where(player => player.PlayerId == playerId)
                        .First();
                    matchingPlayer.Name = playerName;
                    matchingPlayer.InitialName = Helper.innkeeperNames.Contains(playerName)
                        ? Helper.innkeeperNames[0]
                        : Helper.bobTavernNames.Contains(playerName)
                        ? Helper.bobTavernNames[0]
                        : playerName;
                    state.TryAssignLocalPlayer(timestamp, data);
                    Logger.Log("Tried to assign player name", data);
                }
                catch (Exception e)
                {
                    Logger.Log("Exceptionw while assigning player name", data);
                    return false;
                }
                return true;
            }
            return false;
        }
    }
}
