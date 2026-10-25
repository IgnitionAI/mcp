import { AzureTableTools } from '../tools/azure-table-tools.js';

function createTools() {
  const listEntities = jest.fn().mockImplementation(async function* () {});
  const tools = new AzureTableTools('UseDevelopmentStorage=true');
  (tools as any).getTableClient = jest.fn().mockReturnValue({ listEntities });

  return { tools, listEntities };
}

describe('Azure Table query options', () => {
  const tableName = 'TestTable';
  const filter = "Status eq 'active'";
  const select = ['PartitionKey', 'RowKey', 'Status'];

  it('passes filter and select to readTable under queryOptions', async () => {
    const { tools, listEntities } = createTools();

    const result = await tools.readTable({ tableName, filter, select });

    expect(result.success).toBe(true);
    expect(listEntities).toHaveBeenCalledWith({ queryOptions: { filter, select } });
  });

  it('passes filter and select to queryTableAdvanced under queryOptions', async () => {
    const { tools, listEntities } = createTools();

    const result = await tools.queryTableAdvanced({ tableName, filter, select });

    expect(result.success).toBe(true);
    expect(listEntities).toHaveBeenCalledWith({ queryOptions: { filter, select } });
  });

  it('keeps continuationToken at the root for paginated advanced queries', async () => {
    const { tools, listEntities } = createTools();
    const continuationToken = 'next-page';

    const result = await tools.queryTableAdvanced({
      tableName,
      filter,
      select,
      continuationToken,
    });

    expect(result.success).toBe(true);
    expect(listEntities).toHaveBeenCalledWith({
      queryOptions: { filter, select },
      continuationToken,
    });
  });
});
