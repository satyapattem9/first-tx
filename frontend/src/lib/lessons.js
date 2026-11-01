// Single source of truth shared with the backend. Don't copy values out of it.
import data from '../../../shared/lessons.json';

export const NETWORK = data.network;
export const lessons = data.lessons;

export function getLesson(id) {
  return lessons.find((l) => l.id === id);
}
