using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackF5.UnitySpy.HearthstoneLib
{
    public interface IAchievementInfo
    {
        int AchievementId { get; }

        int Progress { get; }

        int Status { get; }
    }
}
