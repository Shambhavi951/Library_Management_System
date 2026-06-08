import { create } from 'zustand';
import { api } from '../api/client.js';

export const useAuth = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('readingNookUser') || 'null'),
  loading: false,
  async login(email, password, login_type) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password, login_type } });
    localStorage.setItem('readingNookAccess', data.accessToken);
    localStorage.setItem('readingNookRefresh', data.refreshToken);
    localStorage.setItem('readingNookUser', JSON.stringify(data.account));
    set({ user: data.account });
  },
  async register(payload) {
    const data = await api('/auth/register', { method: 'POST', body: payload });
    localStorage.setItem('readingNookAccess', data.accessToken);
    localStorage.setItem('readingNookRefresh', data.refreshToken);
    localStorage.setItem('readingNookUser', JSON.stringify(data.account));
    set({ user: data.account });
  },
  async refreshMe() {
    if (!localStorage.getItem('readingNookAccess')) return;
    const profile = await api('/auth/me');
    localStorage.setItem('readingNookUser', JSON.stringify(profile));
    set({ user: profile });
  },
  logout() {
    localStorage.removeItem('readingNookAccess');
    localStorage.removeItem('readingNookRefresh');
    localStorage.removeItem('readingNookUser');
    set({ user: null });
  },
  hasRole(role) {
    return get().user?.role_type === role;
  }
}));

