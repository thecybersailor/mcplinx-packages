<template>
  <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-white">Getting Started</h2>
      <p class="mt-1 text-sm text-slate-400">
        Use the CLI to create and publish connector packages before you manage deployments in the UI.
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <h3 class="mb-2 text-sm font-semibold text-slate-200">1. Create a new connector project</h3>
        <pre class="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs leading-6 text-slate-100"><code>npm create cybersailor-connector@latest my-connector --ai cursor
cd my-connector</code></pre>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-slate-200">2. Deploy your connector</h3>
        <pre class="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/80 p-3 text-xs leading-6 text-slate-100"><code>syntool deploy</code></pre>
      </div>
    </div>
  </div>
</template>
