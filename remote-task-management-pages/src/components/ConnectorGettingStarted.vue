<template>
  <div class="rounded-2xl border border-border bg-muted/20 p-5 text-foreground shadow-sm">
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-foreground">Getting Started</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Use the CLI to create and publish connector packages before you manage deployments in the UI.
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <h3 class="mb-2 text-sm font-semibold text-foreground">1. Create a new connector project</h3>
        <pre class="overflow-x-auto rounded-xl border border-border bg-muted p-3 text-xs leading-6 text-foreground"><code>npm create cybersailor-connector@latest my-connector --ai cursor
cd my-connector</code></pre>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-foreground">2. Publish &amp; deploy (BotWorks)</h3>
        <pre class="overflow-x-auto rounded-xl border border-border bg-muted p-3 text-xs leading-6 text-foreground"><code>syntool login --login-url &lt;login-url&gt;
syntool build
syntool publish
syntool deploy --payload '{"name":"&lt;package&gt;","version":"&lt;version&gt;"}'</code></pre>
      </div>
    </div>
  </div>
</template>
