import { type UserRole } from '../context/AuthContext';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

const defaultMockUsers: UserItem[] = [
  { id: 'admin-id-temp', name: 'Demo Admin', email: 'admin@aegis.edu', role: 'ADMIN', created_at: new Date(Date.now() - 1000*60*60*24*30).toISOString() },
  { id: 'faculty-id-999', name: 'Dr. Sarah Connor', email: 'faculty@aegis.edu', role: 'FACULTY', created_at: new Date(Date.now() - 1000*60*60*24*15).toISOString() },
  { id: 'faculty-id-other', name: 'Prof. Marcus Vance', email: 'marcus.vance@aegis.edu', role: 'FACULTY', created_at: new Date(Date.now() - 1000*60*60*24*14).toISOString() },
  { id: 'student-id-123', name: 'Alex Mercer', email: 'student@aegis.edu', role: 'STUDENT', created_at: new Date(Date.now() - 1000*60*60*24*5).toISOString() },
  { id: 'student-id-998', name: 'Jane Doe', email: 'jane@student.lms.com', role: 'STUDENT', created_at: new Date().toISOString() }
];

const API_URL = 'http://localhost:8000/api/v1/users';

export const userService = {
  async getUsers(): Promise<UserItem[]> {
    try {
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch from API');
      const data = await response.json();
      // Sync mock storage if API succeeds
      localStorage.setItem('aegis_mock_users', JSON.stringify(data));
      return data;
    } catch (err) {
      // Fallback to localStorage
      const local = localStorage.getItem('aegis_mock_users');
      if (local) return JSON.parse(local);
      localStorage.setItem('aegis_mock_users', JSON.stringify(defaultMockUsers));
      return defaultMockUsers;
    }
  },

  async createUser(userData: { name: string; email: string; role: UserRole; password?: string }): Promise<UserItem> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: userData.password || 'defaultpassword123'
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to create user');
      }
      return await response.json();
    } catch (err) {
      // Mock local update
      const users = await this.getUsers();
      const newUser: UserItem = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        created_at: new Date().toISOString()
      };
      users.unshift(newUser);
      localStorage.setItem('aegis_mock_users', JSON.stringify(users));
      return newUser;
    }
  },

  async updateUser(id: string, updateData: { name?: string; email?: string; role?: UserRole; password?: string }): Promise<UserItem> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to update user');
      }
      return await response.json();
    } catch (err) {
      // Mock local update
      const users = await this.getUsers();
      const updated = users.map(u => u.id === id ? { ...u, ...updateData } : u);
      localStorage.setItem('aegis_mock_users', JSON.stringify(updated));
      const user = updated.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aegis_token') || ''}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to delete user');
      }
      return true;
    } catch (err) {
      // Mock local update
      const users = await this.getUsers();
      const filtered = users.filter(u => u.id !== id);
      localStorage.setItem('aegis_mock_users', JSON.stringify(filtered));
      return true;
    }
  }
};
