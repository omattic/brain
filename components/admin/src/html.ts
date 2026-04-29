export function renderAdminHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Brain Admin</title>
    <style>
      :root {
        --bg: #f4efe6;
        --panel: #fffdf8;
        --panel-2: #f7f1e8;
        --fg: #1f1b16;
        --muted: #695c4e;
        --line: #dccfbe;
        --accent: #1f6feb;
        --accent-soft: #e6f0ff;
        --danger: #a61b1b;
        --shadow: 0 18px 40px rgba(31, 27, 22, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
        color: var(--fg);
        background:
          radial-gradient(circle at top left, rgba(31, 111, 235, 0.10), transparent 32%),
          linear-gradient(180deg, #fbf7f1 0%, var(--bg) 100%);
      }
      main {
        max-width: 1240px;
        margin: 0 auto;
        padding: 32px 20px 80px;
      }
      h1, h2, h3 { margin: 0; }
      p { margin: 0; color: var(--muted); }
      .hero {
        display: grid;
        gap: 18px;
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(247,241,232,0.92));
        box-shadow: var(--shadow);
      }
      .hero h1 {
        font-size: clamp(2rem, 5vw, 4.3rem);
        line-height: 0.95;
        letter-spacing: -0.05em;
        max-width: 10ch;
      }
      .hero-grid, .content-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 18px;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 20px;
        box-shadow: var(--shadow);
      }
      .card h2 {
        font-size: 1.1rem;
        margin-bottom: 10px;
      }
      .span-4 { grid-column: span 4; }
      .span-5 { grid-column: span 5; }
      .span-6 { grid-column: span 6; }
      .span-7 { grid-column: span 7; }
      .span-8 { grid-column: span 8; }
      .span-12 { grid-column: span 12; }
      .stack { display: grid; gap: 12px; }
      .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      label {
        display: grid;
        gap: 6px;
        font-size: 0.9rem;
        color: var(--muted);
      }
      input, textarea, select, button {
        font: inherit;
      }
      input, textarea, select {
        width: 100%;
        padding: 11px 12px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: white;
        color: var(--fg);
      }
      textarea { min-height: 110px; resize: vertical; }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        cursor: pointer;
        background: var(--accent);
        color: white;
      }
      button.secondary {
        background: var(--panel-2);
        color: var(--fg);
        border: 1px solid var(--line);
      }
      button.danger { background: var(--danger); }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 0.85rem;
      }
      .list {
        display: grid;
        gap: 10px;
        max-height: 340px;
        overflow: auto;
      }
      .item {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px;
        background: rgba(255,255,255,0.72);
      }
      .item strong { display: block; }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.94rem;
      }
      th, td {
        text-align: left;
        padding: 10px 8px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.88rem;
      }
      .message {
        white-space: pre-wrap;
        border-radius: 14px;
        background: var(--panel-2);
        border: 1px solid var(--line);
        padding: 12px;
        font-size: 0.9rem;
      }
      .empty { color: var(--muted); font-style: italic; }
      @media (max-width: 960px) {
        .span-4, .span-5, .span-6, .span-7, .span-8, .span-12 { grid-column: span 12; }
        main { padding: 18px 14px 48px; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div class="row">
          <span class="pill">brain-admin.omattic.com</span>
          <span class="pill">JWT required for all APIs</span>
          <span class="pill">D1 + KV backed</span>
        </div>
        <div class="hero-grid">
          <div class="span-7 stack">
            <h1>Operate tenants, configs, and failed Meta events.</h1>
            <p>This surface manages the multi-tenant Brain runtime. Add tenants, map Meta accounts, store component config in D1 with KV cache mirroring, and replay failed webhook events.</p>
          </div>
          <div class="span-5 card stack">
            <h2>Session</h2>
            <label>JWT
              <textarea id="token" placeholder="Paste a bearer token from auth.omattic.com"></textarea>
            </label>
            <div class="row">
              <button id="save-token">Use Token</button>
              <button id="load-session" class="secondary">Verify Session</button>
            </div>
            <div id="session-output" class="message">No active session loaded yet.</div>
          </div>
        </div>
      </section>

      <section class="content-grid" style="margin-top: 18px;">
        <div class="span-4 card stack">
          <h2>Create Tenant</h2>
          <label>Name<input id="tenant-name" placeholder="Ingles Con Liza" /></label>
          <label>Slug<input id="tenant-slug" placeholder="ingles-con-liza" /></label>
          <label>Description<textarea id="tenant-description" placeholder="Primary tenant for Instagram automation"></textarea></label>
          <button id="create-tenant">Create Tenant</button>
        </div>

        <div class="span-4 card stack">
          <h2>Tenant Member</h2>
          <label>Tenant<select id="member-tenant"></select></label>
          <label>Email<input id="member-email" placeholder="ops@omattic.com" /></label>
          <label>Role<input id="member-role" value="admin" /></label>
          <button id="add-member">Add Member</button>
        </div>

        <div class="span-4 card stack">
          <h2>Meta Account</h2>
          <label>Tenant<select id="account-tenant"></select></label>
          <label>Provider<input id="account-provider" value="instagram" /></label>
          <label>Account ID<input id="account-id" placeholder="17841401707784079" /></label>
          <label>Username<input id="account-username" placeholder="inglesconliza" /></label>
          <button id="add-account">Register Account</button>
        </div>

        <div class="span-5 card stack">
          <h2>Component Config</h2>
          <label>Tenant<select id="config-tenant"></select></label>
          <label>Component<input id="config-component" value="meta" /></label>
          <label>Key<input id="config-key" placeholder="INSTAGRAM_ACCESS_TOKEN" /></label>
          <label>Value<textarea id="config-value" placeholder='{"profile":"inglesconliza","tokenKey":"instagram/access-token/inglesconliza"}'></textarea></label>
          <label class="row"><input id="config-secret" type="checkbox" style="width:auto" /> Treat as secret</label>
          <button id="save-config">Save Config</button>
        </div>

        <div class="span-7 card stack">
          <h2>Tenants</h2>
          <div id="tenants-list" class="list"><div class="empty">No tenants loaded yet.</div></div>
        </div>

        <div class="span-12 card stack">
          <div class="row" style="justify-content: space-between;">
            <div class="stack" style="gap: 4px;">
              <h2>Failed Meta Webhook Events</h2>
              <p>Filter by tenant or source account, inspect the payload, then replay one event or the current filtered set.</p>
            </div>
            <div class="row">
              <button id="refresh-events" class="secondary">Refresh</button>
              <button id="recover-visible" class="danger">Recover Visible</button>
            </div>
          </div>
          <div class="row">
            <label>Tenant<select id="events-tenant"><option value="">All tenants</option></select></label>
            <label>Source Account ID<input id="events-account" placeholder="17841401707784079" /></label>
            <label>Limit<input id="events-limit" type="number" value="25" min="1" max="100" /></label>
          </div>
          <div style="overflow:auto;">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Tenant</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="events-table">
                <tr><td colspan="6" class="empty">No events loaded yet.</td></tr>
              </tbody>
            </table>
          </div>
          <div id="event-payload" class="message">Select refresh to load failed Meta events.</div>
        </div>
      </section>
    </main>
    <script>
      const state = {
        token: localStorage.getItem("brain_admin_token") || "",
        tenants: [],
        events: []
      };

      const qs = (id) => document.getElementById(id);
      const tokenInput = qs("token");
      tokenInput.value = state.token;

      function authHeaders(extra = {}) {
        if (!state.token) throw new Error("Paste a JWT first.");
        return {
          ...extra,
          authorization: "Bearer " + state.token
        };
      }

      async function api(path, options = {}) {
        const response = await fetch(path, {
          ...options,
          headers: {
            "content-type": "application/json",
            ...(options.headers || {}),
            ...authHeaders(options.headers || {})
          }
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || ("Request failed with status " + response.status));
        }
        return response.json();
      }

      function setSessionMessage(value) {
        qs("session-output").textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
      }

      function tenantOptions(includeBlank = false) {
        const options = [];
        if (includeBlank) options.push('<option value="">Select tenant</option>');
        for (const tenant of state.tenants) {
          options.push('<option value="' + tenant.id + '">' + tenant.name + ' (' + tenant.slug + ')</option>');
        }
        return options.join("");
      }

      function renderTenants() {
        const root = qs("tenants-list");
        qs("member-tenant").innerHTML = tenantOptions(true);
        qs("account-tenant").innerHTML = tenantOptions(true);
        qs("config-tenant").innerHTML = tenantOptions(true);
        qs("events-tenant").innerHTML = '<option value="">All tenants</option>' + tenantOptions(false);

        if (!state.tenants.length) {
          root.innerHTML = '<div class="empty">No tenants created yet.</div>';
          return;
        }

        root.innerHTML = state.tenants.map((tenant) => {
          const members = (tenant.members || []).map((member) => member.email + " · " + member.role).join("<br/>") || '<span class="empty">No members yet.</span>';
          const accounts = (tenant.metaAccounts || []).map((account) => (account.username || account.accountId) + " · " + account.accountId).join("<br/>") || '<span class="empty">No Meta accounts yet.</span>';
          const configs = (tenant.configs || []).map((config) => config.component + ":" + config.key).join("<br/>") || '<span class="empty">No config yet.</span>';
          return '<article class="item stack">' +
            '<div class="row" style="justify-content:space-between;"><strong>' + tenant.name + '</strong><span class="pill">' + tenant.slug + '</span></div>' +
            '<p>' + (tenant.description || 'No description') + '</p>' +
            '<div class="row"><div><strong>Members</strong><div class="mono">' + members + '</div></div></div>' +
            '<div class="row"><div><strong>Meta Accounts</strong><div class="mono">' + accounts + '</div></div></div>' +
            '<div class="row"><div><strong>Config</strong><div class="mono">' + configs + '</div></div></div>' +
            '</article>';
        }).join("");
      }

      function renderEvents() {
        const body = qs("events-table");
        if (!state.events.length) {
          body.innerHTML = '<tr><td colspan="6" class="empty">No failed events for the current filters.</td></tr>';
          return;
        }

        body.innerHTML = state.events.map((event) => {
          return '<tr>' +
            '<td class="mono">' + event.id + '<br/><span style="color:var(--muted)">' + event.updatedAt + '</span></td>' +
            '<td>' + (event.tenantName || "Unmapped") + '</td>' +
            '<td class="mono">' + (event.metaAccountUsername || event.sourceAccountId || "unknown") + '</td>' +
            '<td>' + event.status + '</td>' +
            '<td>' + (event.errorMessage || "") + '</td>' +
            '<td class="row">' +
              '<button class="secondary" data-show="' + event.id + '">Inspect</button>' +
              '<button data-recover="' + event.id + '">Recover</button>' +
            '</td>' +
          '</tr>';
        }).join("");
      }

      async function loadSession() {
        const session = await api("/api/session", { method: "GET" });
        setSessionMessage(session);
      }

      async function loadTenants() {
        const payload = await api("/api/tenants", { method: "GET" });
        state.tenants = payload.tenants || [];
        renderTenants();
      }

      async function loadEvents() {
        const params = new URLSearchParams({
          status: "failed",
          limit: qs("events-limit").value || "25"
        });
        if (qs("events-tenant").value) params.set("tenantId", qs("events-tenant").value);
        if (qs("events-account").value.trim()) params.set("sourceAccountId", qs("events-account").value.trim());
        const payload = await api("/api/monitoring/meta-webhook-events?" + params.toString(), { method: "GET" });
        state.events = payload.events || [];
        renderEvents();
      }

      async function boot() {
        if (!state.token) return;
        try {
          await loadSession();
          await loadTenants();
          await loadEvents();
        } catch (error) {
          setSessionMessage(error.message);
        }
      }

      qs("save-token").addEventListener("click", async () => {
        state.token = tokenInput.value.trim();
        localStorage.setItem("brain_admin_token", state.token);
        await boot();
      });

      qs("load-session").addEventListener("click", async () => {
        state.token = tokenInput.value.trim();
        localStorage.setItem("brain_admin_token", state.token);
        await loadSession();
      });

      qs("create-tenant").addEventListener("click", async () => {
        await api("/api/tenants", {
          method: "POST",
          body: JSON.stringify({
            name: qs("tenant-name").value,
            slug: qs("tenant-slug").value,
            description: qs("tenant-description").value
          })
        });
        await loadTenants();
      });

      qs("add-member").addEventListener("click", async () => {
        await api("/api/tenants/" + qs("member-tenant").value + "/members", {
          method: "POST",
          body: JSON.stringify({
            email: qs("member-email").value,
            role: qs("member-role").value,
            status: "active"
          })
        });
        await loadTenants();
      });

      qs("add-account").addEventListener("click", async () => {
        await api("/api/tenants/" + qs("account-tenant").value + "/meta-accounts", {
          method: "POST",
          body: JSON.stringify({
            provider: qs("account-provider").value,
            accountId: qs("account-id").value,
            username: qs("account-username").value
          })
        });
        await loadTenants();
      });

      qs("save-config").addEventListener("click", async () => {
        let value = qs("config-value").value;
        try {
          value = JSON.parse(value);
        } catch {}
        await api("/api/tenants/" + qs("config-tenant").value + "/configs", {
          method: "PUT",
          body: JSON.stringify({
            component: qs("config-component").value,
            key: qs("config-key").value,
            value,
            isSecret: qs("config-secret").checked
          })
        });
        await loadTenants();
      });

      qs("refresh-events").addEventListener("click", loadEvents);

      qs("recover-visible").addEventListener("click", async () => {
        await api("/api/monitoring/meta-webhook-events/recover", {
          method: "POST",
          body: JSON.stringify({
            tenantId: qs("events-tenant").value || undefined,
            sourceAccountId: qs("events-account").value.trim() || undefined,
            limit: Number(qs("events-limit").value || "25")
          })
        });
        await loadEvents();
      });

      qs("events-table").addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const showId = target.getAttribute("data-show");
        if (showId) {
          const payload = await api("/api/monitoring/meta-webhook-events/" + showId, { method: "GET" });
          qs("event-payload").textContent = JSON.stringify(payload.event, null, 2);
        }

        const recoverId = target.getAttribute("data-recover");
        if (recoverId) {
          await api("/api/monitoring/meta-webhook-events/recover", {
            method: "POST",
            body: JSON.stringify({ eventIds: [recoverId] })
          });
          await loadEvents();
        }
      });

      boot();
    </script>
  </body>
</html>`;
}
