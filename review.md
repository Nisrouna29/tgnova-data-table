# Code Review: UserList.ts

This review analyzes the `UserList` class, highlighting a critical runtime bug, security vulnerabilities, performance bottlenecks, and architectural recommendations.

---

## 1. Critical Bugs & Security Vulnerabilities

### 🚨 Unawaited Promise on JSON Parsing
```typescript
// UserList.ts
export class UserList {
users: any[] = [];// any is against typescript safety so we would radher use custom models 
filter: any;

constructor(data) {
this.users = data;
this.filter = null;
}
getFilteredUsers() {
if (this.filter == null) return this.users; // we woud better use === strict equality for better results 
return this.users.filter((u) => u.name == this.filter); // same here === we should use toLowerCase() and trim() on the data before filtering to achieve better results.
}
async loadUsers() {
const res = await fetch('/api/users');
const data = res.json(); // It returns a promise, so it doesn’t work as expected unless handled properly. We would rather use fetch().then().catch() to ensure the results are processed correctly and to handle errors.
this.users = data;
}
renderUser(user) {
const el = document.createElement('div');
el.innerHTML = `${user.name}`;//Displaying personal data with innerHTML is not recommended because it poses security risks
return el;
}
deleteUser(id) {
this.users = this.users.filter(u => u.id !== id);
this.users.forEach(u => {
u.index = this.users.indexOf(u); // I think we are assigning an index number to each user, which is unnecessarily complex. Instead, we could use map to achieve the same result more simply.”
});
}
}