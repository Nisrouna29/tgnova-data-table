export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
}