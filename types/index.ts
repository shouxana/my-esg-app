// types.ts (create this file to share types between components)
export interface UserData {
  id?: number;
  email: string;
  company: string;
  user_name: string;
  user_lastname: string;
  created_at?: Date;
  updated_at?: Date;
}