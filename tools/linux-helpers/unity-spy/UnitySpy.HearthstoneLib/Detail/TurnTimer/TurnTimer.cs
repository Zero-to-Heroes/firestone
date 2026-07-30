using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.TurnTimer
{
    public class TurnTimer
    {
        public float CurrentTimestamp { get; set; }
        public float CountdownEndTimestamp { get; set; }
        public float CountdownTimeoutSec { get; set; }
    }
}