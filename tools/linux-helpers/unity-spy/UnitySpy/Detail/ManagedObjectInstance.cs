namespace HackF5.UnitySpy.Detail
{
    using System;
    using System.Collections.Generic;

    public abstract class ManagedObjectInstance : MemoryObject, IManagedObjectInstance
    {
        private readonly List<TypeInfo> genericTypeArguments;

        // Optional snapshot of this object's body. When present, field reads are served from this buffer
        // via a ProcessFacade read window instead of a syscall per field. Null when no snapshot was captured.
        private byte[] snapshot;

        // Target-process address that snapshot[0] corresponds to. Usually this.Address, but a snapshot shared
        // between the elements of a bulk-read array uses the array body start instead.
        private long snapshotBase;

        protected ManagedObjectInstance(AssemblyImage image, List<TypeInfo> genericTypeArguments, IntPtr address)
            : base(image, address)
        {
            this.genericTypeArguments = genericTypeArguments;
        }

        protected void SetSnapshot(byte[] buffer)
        {
            this.snapshot = buffer;
            this.snapshotBase = this.Address.ToInt64();
        }

        /// <summary>
        /// Attaches a snapshot buffer whose first byte maps to <paramref name="bufferBase"/> in the target
        /// process. Used by bulk array reads to share one body buffer across all element instances: values are
        /// captured at array-materialization time, which is the same freshness contract as the materialized
        /// array itself (primitive arrays already return values copied at that instant). Pointers read from the
        /// snapshot still resolve to live objects on access.
        /// </summary>
        internal void AttachSnapshot(byte[] buffer, IntPtr bufferBase)
        {
            this.snapshot = buffer;
            this.snapshotBase = bufferBase.ToInt64();
        }

        ITypeDefinition IManagedObjectInstance.TypeDefinition => this.TypeDefinition;

        public abstract TypeDefinition TypeDefinition { get; }

        public dynamic this[string fieldName] => this.GetValue<dynamic>(fieldName);

        public dynamic this[string fieldName, bool exceptionOnMissingField] => this.GetValue<dynamic>(fieldName, exceptionOnMissingField);

        public dynamic this[string fieldName, string typeFullName, bool exceptionOnMissingField = false] => this.GetValue<dynamic>(fieldName, typeFullName, exceptionOnMissingField);

        public TValue GetValue<TValue>(string fieldName, bool exceptionOnMissingField = true) => this.GetValue<TValue>(fieldName, default, exceptionOnMissingField);

        public TValue GetValue<TValue>(string fieldName, string typeFullName, bool exceptionOnMissingField)
        {
            var field = this.TypeDefinition.GetField(fieldName, typeFullName);
            if (field == null && exceptionOnMissingField)
            {
                throw new ArgumentException(
                    $"No field exists with name {fieldName} in type {typeFullName ?? "<any>"}.");
            }

            if (field == null)
            {
                return default;
            }

            var snap = this.snapshot;
            if (snap == null)
            {
                return field.GetValue<TValue>(this.genericTypeArguments, this.Address);
            }

            ProcessFacade.EnterReadWindow(snap, new IntPtr(this.snapshotBase), out var prevBuffer, out var prevBase, out var prevLength);
            try
            {
                return field.GetValue<TValue>(this.genericTypeArguments, this.Address);
            }
            finally
            {
                ProcessFacade.ExitReadWindow(prevBuffer, prevBase, prevLength);
            }
        }

        /// <summary>
        /// Reads a single element of the array stored in <paramref name="fieldName"/> without materializing the
        /// whole array (a plain field read on an array field reads every element from process memory). Used by
        /// hint-based lookups that only need one known slot. The index is validated against the live array
        /// length, so a stale index simply returns <c>default</c>.
        /// </summary>
        public TValue GetArrayValue<TValue>(string fieldName, int index)
        {
            var field = this.TypeDefinition.GetField(fieldName);
            if (field == null)
            {
                return default;
            }

            return field.GetArrayValue<TValue>(this.genericTypeArguments, this.Address, index);
        }
    }
}