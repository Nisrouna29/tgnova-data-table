
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { User } from '../model/user';
import { PagedResponse } from '../model/PagedResponse';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);

  private jsonUrl = 'assets/data/users.json';

  private cachedData: User[] | null = null;
  private pendingRequest$: Observable<User[]> | null = null;

  public searchSubject = new BehaviorSubject<string>('');


  private getMasterData(): Observable<User[]> {
    // 1. Return cache immediately if we already downloaded the big file
    if (this.cachedData) {
      return of(this.cachedData);
    }

    if (!this.pendingRequest$) {
      this.pendingRequest$ = this.http.get<User[]>(this.jsonUrl).pipe(
        tap(data => this.cachedData = data), // Save to cache on success
        shareReplay(1)
      );
    }

    return this.pendingRequest$;
  }

  //It mimics backend behaviors like global text searching, dynamic count aggregation, and SQL-style offset pagination.
  fetchUsers$(page: number, pageSize: number, search: string): Observable<PagedResponse<User>> {
    return this.getMasterData().pipe(
      map(allUsers => {
        let filtered = allUsers;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = allUsers.filter(user =>
            Object.values(user).some(value =>
              String(value).toLowerCase().includes(searchLower)
            )
          );
        }

        const totalItems = filtered.length;
        const maxPage = Math.ceil(filtered.length / pageSize) || 1;
        const safePage = Math.min(page, maxPage);

        const startIndex = (safePage - 1) * pageSize;
        const items = filtered.slice(startIndex, startIndex + pageSize);

        return {
          items,
          totalItems
        };
      })
    );
  }
  clearCache() {
    this.cachedData = null;
    this.pendingRequest$ = null;
  }
}
