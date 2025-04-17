export interface Exercise {
  id?: string
  name: string
  sets: number
  reps: number
  rpe?: number
  rest_seconds?: number
  notes?: string
  weight?: number
}

export interface WorkoutDay {
  id?: string
  day_number: number
  name: string
  is_rest_day: boolean
  exercises: Exercise[]
}

export interface WorkoutTemplate {
  id: string
  name: string
  description: string
  difficulty: string
  category: string
  days: WorkoutDay[]
  created_by?: string | null
}

export interface CompletedWorkout {
  date: string
  day_id: string
  completed: boolean
}

export interface UserWorkout extends WorkoutTemplate {
  userId: string
  startDate: string
  completedWorkouts: CompletedWorkout[]
}

export interface WorkoutProgress {
  id: string
  date: string
  exercise: string
  weight: number
  sets: number
  reps: number
}

export interface CompletedWorkoutDetails {
  id: string
  name: string
  date: string
  exercises: Exercise[]
}
