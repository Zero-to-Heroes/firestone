#region

using System;
using System.Collections.Generic;
using System.IO;
using Force.DeepCloner;

#endregion

namespace HearthstoneReplays
{
	internal static class Utility
	{
		// BinaryFormatter is removed on modern .NET; delegate to the same DeepCloner the
		// entity classes already use. (This method currently has no call sites.)
		internal static object DeepClone(object obj)
		{
			return obj?.DeepClone();
		}

		internal static long GetUtcTimestamp(DateTime time)
        {
			var currentTimeZone = TimeZone.CurrentTimeZone;
			var offset = currentTimeZone.GetUtcOffset(time);
			return (long)time.Subtract(offset).Subtract(new DateTime(1970, 1, 1)).TotalMilliseconds;
		}
	}

	// This is way too slow
    //public class IncludeJsonIgnoreContractResolver : Newtonsoft.Json.Serialization.DefaultContractResolver
    //{
    //    protected override IList<Newtonsoft.Json.Serialization.JsonProperty> CreateProperties(Type type, Newtonsoft.Json.MemberSerialization memberSerialization)
    //    {
    //        var properties = base.CreateProperties(type, memberSerialization);

    //        // Ensure all properties are serialized, even those with [JsonIgnore]
    //        foreach (var property in properties)
    //        {
    //            property.Ignored = false; // Override the Ignored flag
    //        }

    //        return properties;
    //    }
    //}
}