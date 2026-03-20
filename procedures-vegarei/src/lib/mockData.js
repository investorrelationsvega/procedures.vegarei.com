// Used when VITE_DRIVE_INDEX_FILE_ID is not set (local dev)
export const MOCK_INDEX = {
  lastUpdated: '2026-03-11',
  sops: [
    {
      id: 'SUB-SOP-001',
      title: 'Investor Subscription Process',
      category: 'investor',
      version: '1.1',
      lastReviewed: '2026-03-11',
      status: 'active',
      owner: 'J Jones',
      company: 'private-equity',
      htmlFileId: null,
      metaFileId: null,
    },
    {
      id: 'TAX-SOP-001',
      title: 'Year-End Tax Lifecycle (K-1 Processing)',
      category: 'tax',
      version: '1.0',
      lastReviewed: '2026-03-11',
      status: 'active',
      owner: 'J Jones',
      company: 'private-equity',
      htmlFileId: null,
      metaFileId: null,
    },
  ],
}
