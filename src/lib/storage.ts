import { Registration } from '../types';

const STORAGE_KEY = 'ignitex_2026_registrations';

export function getStoredRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local registrations:', err);
    return [];
  }
}

export function saveRegistrations(regs: Registration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regs));
  } catch (err) {
    console.error('Failed to save registrations to localStorage:', err);
  }
}

export function addRegistration(reg: Registration): Registration[] {
  const current = getStoredRegistrations();
  const updated = [reg, ...current.filter((r) => r.id !== reg.id)];
  saveRegistrations(updated);
  return updated;
}

export function addBatchRegistrations(newRegs: Registration[]): Registration[] {
  const current = getStoredRegistrations();
  const newIds = new Set(newRegs.map((r) => r.id));
  const updated = [...newRegs, ...current.filter((r) => !newIds.has(r.id))];
  saveRegistrations(updated);
  return updated;
}

export function updateStoredRegistration(id: string, updates: Partial<Registration>): Registration[] {
  const current = getStoredRegistrations();
  const updated = current.map((r) => (r.id === id ? { ...r, ...updates } : r));
  saveRegistrations(updated);
  return updated;
}
