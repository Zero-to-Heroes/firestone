#region
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
#endregion

namespace HearthstoneReplays.Parser.ReplayData.Entities
{
	public class PlayerReport
    {
        public int TotalHealth { get; set; }
        public int DamageTaken { get; set; }
        public int ArmorLeft { get; set; }

        internal static PlayerReport BuildPlayerReport(GameState state, int id)
        {
            var playerState = state.GetPlayerHeroEntity(id);
            return new PlayerReport
            {
                TotalHealth = playerState.GetTag(GameTag.HEALTH),
                DamageTaken = playerState.GetTag(GameTag.DAMAGE, 0),
                ArmorLeft = playerState.GetTag(GameTag.ARMOR, 0)
            };
        }
    }
}