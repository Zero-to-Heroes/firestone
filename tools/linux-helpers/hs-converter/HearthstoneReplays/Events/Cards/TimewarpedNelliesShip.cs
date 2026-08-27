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
using HearthstoneReplays.Events.Parsers;

namespace HearthstoneReplays.Events.Cards
{
    internal class TimewarpedNelliesShip
    {
        public static FullEntity EnhanceEntity(FullEntity initialEntity, StateFacade stateFacade)
        {
            var createdByNellie = stateFacade.GsState.Replay.Games[stateFacade.GsState.Replay.Games.Count - 1]
                .FilterGameData(typeof(FullEntity))
                .Select(d => d as FullEntity)
                .Where(e => e.GetTag(GameTag.CREATOR) == initialEntity.Entity && e.GetZone() == (int)Zone.HAND)
                .ToList();
            var debug = stateFacade.GsState.GameState.CurrentEntities.GetValueOrDefault(7861);
            // The player, we added the entity to hand
            if (createdByNellie.Count > 0)
            {
                // Not perfect in case the user picks multiple times the same card, but it's hard to get the real info
                // otherwise, because of cards like Macaw
                initialEntity.DynamicInfo.AddRange(createdByNellie.Select(e => e.CardId).Distinct());
            }
            // The opponent. This means we don't know their hand, but on the other hand the entites with the right creator should
            // always be the correct ones, as the opponent's entities change between fights
            else
            {
                var spawnedByNellie = stateFacade.GsState.Replay.Games[stateFacade.GsState.Replay.Games.Count - 1]
                    .FilterGameData(typeof(FullEntity))
                    .Select(d => d as FullEntity)
                    .Where(e => e.GetTag(GameTag.CREATOR) == initialEntity.Entity)
                    .ToList();
                if (spawnedByNellie != null)
                {
                    // Not perfect in case the user picks multiple times the same card, but it's hard to get the real info
                    // otherwise, because of cards like Macaw
                    initialEntity.DynamicInfo.AddRange(spawnedByNellie.Select(e => e.CardId).Distinct());
                }
            }
            return initialEntity;
        }
    }
}
