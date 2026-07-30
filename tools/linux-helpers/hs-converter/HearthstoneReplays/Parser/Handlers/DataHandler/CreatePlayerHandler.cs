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
    internal class CreatePlayerHandler
    {
        public static bool HandleCreatePlayer(string data, ParserState state, StateFacade stateFacade, int indentLevel)
        {
            var match = Regexes.ActionCreategamePlayerRegex.Match(data);
            // We already have the player entities while reconnecting, so we don't re-parse them
            if (!state.ReconnectionOngoing && match.Success)
            {
                var id = match.Groups[1].Value;
                var playerId = match.Groups[2].Value;
                var accountHi = match.Groups[3].Value;
                var accountLo = match.Groups[4].Value;
                var gsPlayer = stateFacade.GetPlayers()?.Find(p => p.Id == int.Parse(id));
                var pEntity = new PlayerEntity()
                {
                    Id = int.Parse(id),
                    AccountHi = accountHi,
                    AccountLo = accountLo,
                    PlayerId = int.Parse(playerId),
                    InitialName = gsPlayer?.InitialName,
                    Name = gsPlayer?.Name,
                    Tags = new List<Tag>(),
                    IsMainPlayer = gsPlayer?.IsMainPlayer ?? false,
                    Cardback = gsPlayer?.Cardback,
                    LegendRank = gsPlayer?.LegendRank,
                    Rank = gsPlayer?.Rank,
                };
                state.UpdateCurrentNode(typeof(Game));
                state.CurrentGame.AddData(pEntity);

                var newNode = new Node(typeof(PlayerEntity), pEntity, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
