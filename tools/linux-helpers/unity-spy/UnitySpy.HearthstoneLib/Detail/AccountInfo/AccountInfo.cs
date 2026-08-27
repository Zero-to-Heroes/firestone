namespace HackF5.UnitySpy.HearthstoneLib.Detail.AccountInfo
{
    using System.Collections.Generic;
    using HackF5.UnitySpy.HearthstoneLib;

    public class AccountInfo : IAccountInfo
    {
        public ulong Hi { get; set; }
        public ulong Lo { get; set; }
        public string BattleTag { get; set; }
    }
}
