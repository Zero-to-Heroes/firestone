using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib.Detail.EventTimings
{
    public class EventTiming
    {
        public long Key { get; set; }
        public long Id { get; set; }
        public string Name { get; set; }
        public int Type { get; set; }
        public ulong StartTimeUtc { get; set; }
        public ulong EndTimeUtc { get; set; }
    }
}
