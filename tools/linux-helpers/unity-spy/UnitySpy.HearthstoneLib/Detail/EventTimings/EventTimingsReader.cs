// ReSharper disable StringLiteralTypo
namespace HackF5.UnitySpy.HearthstoneLib.Detail.EventTimings
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    internal static class EventTimingsReader
    {
        public static IReadOnlyList<EventTiming> ReadEventTimings(HearthstoneImage image)
        {
            var manager = image.GetService("EventTimingManager")["m_eventTimings"];
            var count = manager["_count"];
            var entries = manager["_entries"];
            var result = new List<EventTiming>();
            for (var i = 0; i < count; i++)
            {
                var entry = entries[i];
                var eventKey = entry["key"];
                long eventId = entry["value"]["<Id>k__BackingField"];
                string eventName = entry["value"]["<Name>k__BackingField"];
                int eventType = entry["value"]["<Type>k__BackingField"];
                ulong startTimeUtc = entry["value"]["<StartTimeUtc>k__BackingField"]["value"]["_dateData"];
                ulong endTimeUtc = entry["value"]["<EndTimeUtc>k__BackingField"]["value"]["_dateData"];
                result.Add(new EventTiming()
                {
                    Key = eventKey,
                    Id = eventId,
                    Name = eventName,
                    Type = eventType,
                    StartTimeUtc = startTimeUtc,
                    EndTimeUtc = endTimeUtc,
                });
            }
            return result;
        }
    }
}