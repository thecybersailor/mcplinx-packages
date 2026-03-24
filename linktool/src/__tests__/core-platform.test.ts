import { describe, expect, it, vi } from 'vitest';
import { createLinktoolCoreContext } from '../core/types.js';
import {
  runConnectionCreate,
  runConnectionDelete,
  runConnectionList,
  runDeploy,
  runList,
  runPublish,
} from '../core/platform.js';

describe('linktool core platform runners', () => {
  it('runs publish against injected platform runtime', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ data: { ok: true, kind: 'publish' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await runPublish(
      createLinktoolCoreContext({ cwd: '/tmp/connector' }),
      { payload: { name: 'demo' } },
      {
        fetchImpl,
        resolvePublishRuntime: async () => ({
          baseUrl: 'https://host.example.com',
          accessToken: 'token_1',
          publishPath: '/api/v1/connectors/publish',
        }),
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://host.example.com/api/v1/connectors/publish',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'demo' }),
      }),
    );
    expect(result).toEqual({ ok: true, kind: 'publish' });
  });

  it('runs list/deploy against injected platform runtime', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'pkg_1' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true, kind: 'deploy' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const ctx = createLinktoolCoreContext({ cwd: '/tmp/connector' });
    const resolvePublishRuntime = async () => ({
      baseUrl: 'https://host.example.com',
      accessToken: 'token_2',
      publishPath: '/api/v1/connectors/publish',
      deployPath: '/api/v1/connectors/deploy',
      listPath: '/api/v1/connectors/versions',
    });

    const listResult = await runList(
      ctx,
      { kind: 'connectors', query: { q: 'demo' } },
      { fetchImpl, resolvePublishRuntime },
    );
    const deployResult = await runDeploy(
      ctx,
      { payload: { version: '1.0.0' } },
      { fetchImpl, resolvePublishRuntime },
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://host.example.com/api/v1/connectors/connectors?q=demo',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_2',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://host.example.com/api/v1/connectors/deploy',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_2',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ version: '1.0.0' }),
      }),
    );
    expect(listResult).toEqual([{ id: 'pkg_1' }]);
    expect(deployResult).toEqual({ ok: true, kind: 'deploy' });
  });

  it('runs connection operations against injected connection runtime', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'conn_1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'conn_1' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { deleted: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const ctx = createLinktoolCoreContext({ cwd: '/tmp/connector' });
    const resolveConnectionRuntime = async () => ({
      baseUrl: 'https://mcplinx.example.com',
      accessToken: 'hub_token',
      connectionsPath: '/user/app/connections',
    });

    const created = await runConnectionCreate(
      ctx,
      { connectorId: 'connector-demo', label: 'Demo' },
      { fetchImpl, resolveConnectionRuntime },
    );
    const listed = await runConnectionList(ctx, {}, { fetchImpl, resolveConnectionRuntime });
    const deleted = await runConnectionDelete(
      ctx,
      { connectionId: 'conn_1' },
      { fetchImpl, resolveConnectionRuntime },
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://mcplinx.example.com/user/app/connections',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer hub_token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          connector_id: 'connector-demo',
          label: 'Demo',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://mcplinx.example.com/user/app/connections',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer hub_token',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      'https://mcplinx.example.com/user/app/connections/conn_1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer hub_token',
        }),
      }),
    );

    expect(created).toEqual({ id: 'conn_1' });
    expect(listed).toEqual([{ id: 'conn_1' }]);
    expect(deleted).toEqual({ deleted: true });
  });
});
