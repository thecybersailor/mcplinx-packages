import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'linktool-publish-'));
    fs.mkdirSync(path.join(cwd, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'dist/bundle.js'), 'console.log("demo")');
    fs.writeFileSync(path.join(cwd, 'dist/manifest.json'), '{"tools":[]}');
    fs.writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: '@examples/demo-connector', version: '0.1.0' }),
    );
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              upload_urls: {
                'bundle.js': 'https://upload.example.com/bundle.js',
                'manifest.json': 'https://upload.example.com/manifest.json',
              },
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true, kind: 'publish' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const result = await runPublish(
      createLinktoolCoreContext({ cwd }),
      { payload: { connectorKey: 'examples/demo-connector' } },
      {
        fetchImpl,
        resolvePublishRuntime: async () => ({
          baseUrl: 'https://host.example.com',
          accessToken: 'token_1',
          publishPath: '/api/v1/connectors/publish',
          uploadPath: '/api/v1/connectors/upload-url',
        }),
      },
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://host.example.com/api/v1/connectors/upload-url',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: 'examples/demo-connector',
          files: ['bundle.js', 'manifest.json'],
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://upload.example.com/bundle.js',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/javascript',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      'https://upload.example.com/manifest.json',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      'https://host.example.com/api/v1/connectors/publish',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: 'examples/demo-connector' }),
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

  it('defaults versions listing to the current connector package name', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'linktool-list-versions-'));
    fs.writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ name: '@examples/demo-connector', version: '0.1.0' }),
    );

    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ version: '42de82a8' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await runList(
      createLinktoolCoreContext({ cwd }),
      { kind: 'versions' },
      {
        fetchImpl,
        resolvePublishRuntime: async () => ({
          baseUrl: 'https://host.example.com',
          accessToken: 'token_3',
          publishPath: '/api/v1/connectors/publish',
          listPath: '/api/v1/connectors/versions',
        }),
      },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://host.example.com/api/v1/connectors/versions?connector_id=examples%2Fdemo-connector',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token_3',
        }),
      }),
    );
    expect(result).toEqual([{ version: '42de82a8' }]);
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
