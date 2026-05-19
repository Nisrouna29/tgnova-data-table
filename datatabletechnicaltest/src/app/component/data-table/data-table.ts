import { ChangeDetectionStrategy, Component, computed, effect, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeColumn } from '../../model/BadgeColumn';
import { BaseColumn } from '../../model/BaseColumn';

@Component({
  selector: 'data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable<T extends Record<string, unknown>> {
  columns = input<(BaseColumn | BadgeColumn)[]>([]);

  totalItems = input<number>(1);

  data = model<T[]>([]);
  loading = model<boolean>(false);

  currentPage = model<number>(1);
  pageSize = model<PageItem>(10);

  searchChange = output<string>();
  pageChange = output<number>();

  showEmptyMessage = input<boolean>(false);

  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');

  maxPage = computed(() => {
    const size = Number(this.pageSize());
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  // for better rendering if we have big data we show max 5 pages numbers and use ellipsis to indicate more pages
  pagesArray = computed<PageItem[]>(() => {
    const max = this.maxPage();
    const current = this.currentPage();
    const result: PageItem[] = [];

    if (max <= 5) {
      for (let i = 1; i <= max; i++) result.push(i);
      return result;
    }

    result.push(1);
    let start = Math.max(2, current - 1);
    let end = Math.min(max - 1, current + 1);
    if (current <= 3) {
      start = 2;
      end = 4;
    }
    if (current >= max - 2) {
      start = max - 3;
      end = max - 1;
    }
    if (start > 2) result.push('ELLIPSIS');
    for (let i = start; i <= end; i++) result.push(i);
    if (end < max - 1) result.push('ELLIPSIS');
    result.push(max);

    return result;
  });


  startRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;

    const size = Number(this.pageSize());

    const current = Math.min(this.currentPage(), Math.ceil(total / size));

    return (current - 1) * size + 1;
  });

  endRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;

    const size = Number(this.pageSize());

    const current = Math.min(this.currentPage(), Math.ceil(total / size));
    const end = current * size;

    return Math.min(end, total);
  });

  onPageClick(page: number | 'ELLIPSIS'): void {
    if (page !== 'ELLIPSIS') {
      this.pageChange.emit(page);
    }
    this.resetSorting();
  }


  toggleSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.applySort();
  }
  // we apply the sort on the client side after we receive the data, this is to avoid making multiple requests to the server when the user clicks on the same column multiple times. we can also implement server side sorting if needed.
  applySort() {
    const key = this.sortKey();
    const dir = this.sortDir();

    if (!key) return;

    const sorted = [...this.data()].sort((a, b) => {
      const v1 = a?.[key];
      const v2 = b?.[key];

      const val1 = typeof v1 === 'string' ? v1.toLowerCase() : v1 ?? '';
      const val2 = typeof v2 === 'string' ? v2.toLowerCase() : v2 ?? '';

      if (val1 < val2) return dir === 'asc' ? -1 : 1;
      if (val1 > val2) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    this.data.set(sorted);
  }

  onPageSizeChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newSize = parseInt(selectElement.value, 10);
    this.pageSize.set(newSize);
    if (this.currentPage() > this.maxPage()) {
      this.currentPage.set(this.maxPage());
      this.pageChange.emit(this.maxPage());
    }
    this.resetSorting()
  }

  onSearchInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
    this.resetSorting();
  }

  getBadgeClass(col: BaseColumn | BadgeColumn, value: unknown) {
    if (col.type !== 'badge') {
      return '';
    }
    const badgeCol = col as BadgeColumn;
    const stringValue = String(value ?? '');
    const variant = badgeCol.badgeMap?.[stringValue] ?? 'danger';
    return `badge-${variant}`;
  }

  isDate(value: unknown): value is DatePipeInput {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return !isNaN(Date.parse(value.toString()));
    }
    return false;
  }
  // just to fix tpescript error when we use pipe 
  asDateInput(value: unknown): DatePipeInput {
    return value as DatePipeInput;
  }

  resetSorting() {
    this.sortKey.set(null);
    this.sortDir.set('asc');
  }

}
export type DatePipeInput = string | number | Date;
type PageItem = number | 'ELLIPSIS';
