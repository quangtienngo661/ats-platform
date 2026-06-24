export interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IPaginatedResponse<T> {
    items: T[];
    pagination: IPaginationMeta;
}
