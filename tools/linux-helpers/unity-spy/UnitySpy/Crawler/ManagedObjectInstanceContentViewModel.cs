namespace HackF5.UnitySpy.Crawler
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using JetBrains.Annotations;

    public class ManagedObjectInstanceContentViewModel
    {
        private readonly IManagedObjectInstance instance;

        public ManagedObjectInstanceContentViewModel(
            [NotNull] IManagedObjectInstance instance)
        {
            this.instance = instance ?? throw new ArgumentNullException(nameof(instance));
            this.InstanceFields = this.instance.TypeDefinition.Fields
                .Where(f => !f.TypeInfo.IsStatic && !f.TypeInfo.IsConstant)
                .Select(f => new InstanceFieldViewModel(f, instance))
                .ToArray();
        }

        //public delegate ManagedObjectInstanceContentViewModel Factory(IManagedObjectInstance instance);

        public IEnumerable<InstanceFieldViewModel> InstanceFields { get; }
    }
}