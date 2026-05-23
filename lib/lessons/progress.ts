import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLessonsForPath } from '@/constants/lessonPaths';
import type { LaunchLanguage } from '@/constants/scenarios';
import type { LearnerLevel, LessonNode } from '@/lib/learning/types';

const COMPLETED_KEY = '@voxa/lessons/v1/completed';

export async function getCompletedLessonIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(COMPLETED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function markLessonCompleted(lessonId: string): Promise<void> {
  const existing = await getCompletedLessonIds();
  if (existing.includes(lessonId)) return;
  await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...existing, lessonId]));
}

export function isLessonUnlocked(
  lessonId: string,
  language: LaunchLanguage,
  level: LearnerLevel,
  completedIds: string[],
): boolean {
  const lessons = getLessonsForPath(language, level);
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index <= 0) return true;

  const previous = lessons[index - 1];
  return completedIds.includes(previous.id);
}

export function isLessonCompleted(lessonId: string, completedIds: string[]): boolean {
  return completedIds.includes(lessonId);
}

/** True when the learner has completed at least one guided lesson. */
export function hasLessonProgress(completedIds: string[]): boolean {
  return completedIds.length > 0;
}

/** Next incomplete unlocked lesson on the path, or null if all complete / none unlocked. */
export function findContinueLesson(
  language: LaunchLanguage,
  level: LearnerLevel,
  completedIds: string[],
): LessonNode | null {
  const lessons = getLessonsForPath(language, level);
  for (const lesson of lessons) {
    if (!isLessonUnlocked(lesson.id, language, level, completedIds)) {
      return null;
    }
    if (!isLessonCompleted(lesson.id, completedIds)) {
      return lesson;
    }
  }
  return null;
}
