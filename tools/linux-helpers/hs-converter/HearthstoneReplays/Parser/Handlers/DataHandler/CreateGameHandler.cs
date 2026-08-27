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
    internal class CreateGameHandler
    {
        public static bool HandleCreateGame(DateTime timestamp, string data, ParserState state, int indentLevel)
        {
            var match = Regexes.GameEntityRegex.Match(data);
            if (match.Success)
            {
                var id = match.Groups[1].Value;
                var gEntity = new GameEntity { Id = int.Parse(id), Tags = new List<Tag>(), TimeStamp = timestamp };
                state.CurrentGame.AddData(gEntity);
                var newNode = new Node(typeof(GameEntity), gEntity, indentLevel, state.Node, data);
                state.CreateNewNode(newNode);
                state.Node = newNode;
                return true;
            }
            return false;
        }
    }
}
