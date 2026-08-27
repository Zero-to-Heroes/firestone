using System;
using System.Collections.Generic;

namespace HackF5.UnitySpy.HearthstoneLib.Detail
{
    internal class HearthstoneImage : IDisposable
    {
        private readonly IAssemblyImage image;
        private bool disposed;

        // Structural hints only: remember which slot of the (live, re-resolved) service-locator entries array /
        // NetCache value slots last held a given service. This lets us skip the linear scan over all entries,
        // and - because the slot is validated with a single-element read - avoid materializing the whole entries
        // array at all on a hit. It is NOT a data cache: the slot is re-validated against live memory and the
        // service is read live every call, so it can never return stale data the way caching the resolved
        // instances did.
        private readonly Dictionary<string, int> serviceSlotHints = new Dictionary<string, int>();

        private readonly Dictionary<string, int> netCacheSlotHints = new Dictionary<string, int>();

        public HearthstoneImage(IAssemblyImage image)
        {
            this.image = image;
        }

        public void Dispose()
        {
            if (!disposed)
            {
                image?.Dispose();
                disposed = true;
            }
        }

        public dynamic this[string fullTypeName] => this.image[fullTypeName];

        public IEnumerable<ITypeDefinition> TypeDefinitions => this.image.TypeDefinitions;

        /// <param name="retryWithoutCacheIfNotFound">
        /// When true, if the service is not found in the locator snapshot, the locator is read again from
        /// memory before returning null.
        /// </param>
        public dynamic GetService(string name, bool retryWithoutCacheIfNotFound = false)
        {
            try
            {
                var found = this.FindService(ResolveServices(), name);
                if (found != null)
                {
                    return found;
                }

                if (retryWithoutCacheIfNotFound)
                {
                    return this.FindService(ResolveServices(), name);
                }
            }
            catch (Exception)
            {
                InvalidateCache();
                return null;
            }

            return null;
        }

        /// <param name="retryWithoutCacheIfNotFound">
        /// When true, <see cref="GetService"/> for <c>NetCache</c> uses a fresh locator read if the first lookup fails.
        /// </param>
        public dynamic GetNetCacheService(string serviceName, bool retryWithoutCacheIfNotFound = false)
        {
            var netCache = GetService("NetCache", retryWithoutCacheIfNotFound)?["m_netCache"];
            if (netCache == null)
            {
                return null;
            }

            // Fast path: re-validate the remembered slot with a single-element read (no full valueSlots
            // materialization). The type name is re-checked against live memory, so a hit is always fresh.
            if (this.netCacheSlotHints.TryGetValue(serviceName, out var hintSlot))
            {
                try
                {
                    var hinted = (netCache as IManagedObjectInstance)?.GetArrayValue<dynamic>("valueSlots", hintSlot);
                    if (hinted != null && hinted.TypeDefinition.Name == serviceName)
                    {
                        return hinted;
                    }
                }
                catch (Exception)
                {
                    // Fall through to the scan.
                }

                this.netCacheSlotHints.Remove(serviceName);
            }

            var netCacheValues = netCache["valueSlots"];
            if (netCacheValues == null)
            {
                return null;
            }

            int length = netCacheValues.Length;
            for (int i = 0; i < length; i++)
            {
                var slot = netCacheValues[i];
                var name = slot?.TypeDefinition.Name;
                if (name == serviceName)
                {
                    this.netCacheSlotHints[serviceName] = i;
                    return slot;
                }
            }

            return null;
        }

        private void InvalidateCache()
        {
            this.serviceSlotHints.Clear();
            this.netCacheSlotHints.Clear();
        }

        private dynamic FindService(dynamic services, string name)
        {
            if (services == null)
            {
                return null;
            }

            // Fast path: re-validate the remembered slot for this service against live memory with a
            // single-element read, avoiding the materialization of the whole entries array. Because the
            // service type name is re-read and compared here, and the service itself is read live below, a
            // successful hit is always fresh; a miss (rehash/resize/reclaim) just falls through to the scan.
            if (this.serviceSlotHints.TryGetValue(name, out var hintSlot))
            {
                try
                {
                    var hinted = (services as IManagedObjectInstance)?.GetArrayValue<dynamic>("_entries", hintSlot);
                    var hintedName = hinted?["value"]?["<ServiceTypeName>k__BackingField"];
                    if (hintedName == name)
                    {
                        return hinted["value"]["<Service>k__BackingField"];
                    }
                }
                catch (Exception)
                {
                    // Fall through to the scan.
                }

                this.serviceSlotHints.Remove(name);
            }

            var serviceItems = services["_entries"];
            if (serviceItems == null)
            {
                return null;
            }

            int length = serviceItems.Length;
            for (int i = 0; i < length; i++)
            {
                var service = serviceItems[i];
                var serviceName = service?["value"]?["<ServiceTypeName>k__BackingField"];
                if (serviceName == name)
                {
                    this.serviceSlotHints[name] = i;
                    return service["value"]["<Service>k__BackingField"];
                }
            }

            return null;
        }

        /// <summary>
        /// Resolves the live service-locator dictionary (not its entries array): entries are only materialized
        /// by <see cref="FindService"/> when the slot hint cannot answer the lookup. No live data is cached.
        /// </summary>
        private dynamic ResolveServices()
        {
            var dependencyBuilders = image["Hearthstone.HearthstoneJobs"]?["s_dependencyBuilder"]?["_items"];
            if (dependencyBuilders == null)
            {
                return null;
            }

            var serviceLocator = dependencyBuilders[0]?["m_serviceLocator"];
            if (serviceLocator == null)
            {
                return null;
            }

            return serviceLocator["m_services"];
        }
    }
}