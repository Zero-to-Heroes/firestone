using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using HearthstoneReplays.Parser.ReplayData.Entities;

namespace HearthstoneReplays.Events.Cards
{
    internal class Mimicry
    {
        public static string PredctCardId(GameState gameState, int entityId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Type != typeof(Action))
            {
                return null;
            }

            var act = node.Parent.Object as Action;
            return act.Data
                .Where(d => d is FullEntity)
                .Select(d => d as FullEntity)
                .Select(d => gameState.CurrentEntities.GetValueOrDefault(d.Entity))
                .Where(d => d.GetTag(GameTag.COPIED_FROM_ENTITY_ID) == entityId)
                .LastOrDefault()?.CardId;
        }
    }
}
