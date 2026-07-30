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
    internal class RazaTheResealed
    {
        public static string PredctCardId(GameState gameState, string creatorCardId, int creatorEntityId, Node node, StateFacade stateFacade)
        {
            if (node.Parent?.Type != typeof(Action))
            {
                return null;
            }

            var act = node.Parent.Object as Action;
            var actionEntity = gameState.CurrentEntities.GetValueOrDefault(act.Entity);
            if (actionEntity.CardIdsToCreate.Count == 0)
            {
                var subSpell = (node.Object as FullEntity).SubSpellInEffect;
                // No targets when the opponent plays it
                if (subSpell?.Targets != null)
                {
                    actionEntity.CardIdsToCreate = subSpell.Targets.Select(t => gameState.CurrentEntities.GetValueOrDefault(t)?.CardId).ToList();
                }
            }

            if (actionEntity.CardIdsToCreate.Count > 0)
            {
                var result = actionEntity.CardIdsToCreate[0];
                actionEntity.CardIdsToCreate.RemoveAt(0);
                return result;
            }
            return null;
        }
    }
}
