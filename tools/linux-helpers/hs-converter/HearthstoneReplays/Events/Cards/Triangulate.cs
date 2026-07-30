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
    internal class Triangulate
    {
        public static string PredctCardId(GameState gameState, string creatorCardId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Type != typeof(Action))
            {
                return null;
            }
            
            var act = node.Parent.Parent.Object as Action;
            if (act.Type != (int)BlockType.PLAY)
            {
                return null;
            }

            var actionEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
            var controller = actionEntity.GetController();

            var triggerAction = act.Data
                .Where(d => d is Action)
                .Select(d => d as Action)
                .Where(a => a.Type == (int)BlockType.POWER && a.Entity == act.Entity)
                .FirstOrDefault();
            if (triggerAction == null)
            {
                return null;
            }

            // First ShowEntity is the card we've picked?
            var showEntity = triggerAction.Data
                .Where(d => d is ShowEntity)
                .Select(d => d as ShowEntity)
                .FirstOrDefault();

            // Avoid info leaks, as the card is revealed in the logs
            // UNLESS the card is CAST_WHEN_DRAWN / SUMMONED_WHEN_DRAWN
            var canReveal = showEntity.GetTag(GameTag.CASTS_WHEN_DRAWN) == 1 || showEntity.GetTag(GameTag.SUMMONED_WHEN_DRAWN) == 1;
            if (controller != stateFacade.LocalPlayer.PlayerId && !canReveal)
            {
                return null;
            }

            return showEntity?.CardId;
        }
    }
}
