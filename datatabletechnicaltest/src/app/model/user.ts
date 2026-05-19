export interface User extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  status: string;
  joiningDate: string; 
}