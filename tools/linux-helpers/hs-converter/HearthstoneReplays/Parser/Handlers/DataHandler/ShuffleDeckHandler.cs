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
    internal class ShuffleDeckHandler
    {
        public static bool HandleShuffleDeck(DateTime timestamp, string data, ParserState state, int indentLevel)
        {
            var match = Regexes.ActionShuffleDeckRegex.Match(data);
            if (match.Success)
            {
                var playerId = match.Groups[1].Value;

                var shuffleNode = new ShuffleDeck
                {
                    PlayerId = int.Parse(playerId),
                    TimeStamp = timestamp,
                };
                state.UpdateCurrentNode(typeof(Game), typeof(Action));
                state.CreateNewNode(new Node(typeof(ShuffleDeck), shuffleNode, indentLevel, state.Node, data));

                if (state.Node.Type == typeof(Game))
                    ((Game)state.Node.Object).AddData(shuffleNode);
                else if (state.Node.Type == typeof(Action))
                    ((Action)state.Node.Object).Data.Add(shuffleNode);
                else
                    throw new Exception("Invalid node " + state.Node.Type);

                return true;
            }
            return false;
        }
    }
}
