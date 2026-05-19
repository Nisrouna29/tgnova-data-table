import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { DataTable } from './component/data-table/data-table';
import { UsersService } from './service/users.service';
import { debounceTime, distinctUntilChanged, firstValueFrom, Subscription } from 'rxjs';
import { BaseColumn } from './model/BaseColumn';
import { BadgeColumn } from './model/BadgeColumn';
import { User } from './model/user';
import { PageItem } from './shared/ui.types';

@Component({
  selector: 'app-root',
  imports: [DataTable],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private usersService = inject(UsersService);
  private cachedItems: User[] = [];
  private cachedTotal = 0;
  private hasLoadedData = signal(false);
  private subscription!: Subscription;
  constructor() {
    this.subscription = this.usersService.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm.set(value);
    });
  }
  public columns: (BaseColumn | BadgeColumn)[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'text'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeMap: {
        active: 'success',
        pending: 'warning',
        blocked: 'danger'
      }
    },
    {
      key: 'joiningDate',
      label: 'Joining Date',
      type: 'date'
    }
  ];

  pageSize = signal(10);
  currentPage = signal(1);
  searchTerm = signal('');

usersResource = resource({
  params: () => ({
    page: this.currentPage(),
    size: this.pageSize(),
    search: this.searchTerm()
  }),

  loader: async ({ params }) => {
    // Simulate network delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await firstValueFrom(
      this.usersService.fetchUsers$(params.page, params.size, params.search)
    );
    
    this.hasLoadedData.set(true);

    return result;
  }
});

  users = computed(() => {
    const freshData = this.usersResource.value()?.items;

    if (freshData !== undefined) {
      this.cachedItems = freshData;
      return freshData;
    }
    return this.cachedItems;
  });

  totalItems = computed(() => {
    const freshTotal = this.usersResource.value()?.totalItems;
    if (freshTotal !== undefined) {
      this.cachedTotal = freshTotal;
      return freshTotal;
    }
    return this.cachedTotal;
  });

  showNoDataMessage = computed(() => {
    return this.hasLoadedData() && !this.isLoading() && this.users().length === 0;
  });

  isLoading = computed(() => this.usersResource.isLoading());

  onSearch(value: string) {
    this.currentPage.set(1);
    this.usersService.searchSubject.next(value);
  }

  onPageClick(page: number) {
    this.currentPage.set(page);
  }
  onPageSizeChange(newSize: PageItem) {
    if (typeof newSize === 'number') {
      this.pageSize.set(newSize);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
