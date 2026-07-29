import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';

export interface Container {
  gupyMcpClient: typeof gupyMcpClient;
}

export function getContainer(): Container {
  return { gupyMcpClient };
}
