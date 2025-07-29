
export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export const applyPagination = (query: any, config: PaginationConfig) => {
  const { page, pageSize } = config;
  const startIndex = (page - 1) * pageSize;
  
  return query
    .order('created_at', { ascending: false })
    .range(startIndex, startIndex + pageSize - 1);
};

export const calculatePaginationMeta = (totalCount: number, pageSize: number, currentPage: number) => {
  return {
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage
  };
};
