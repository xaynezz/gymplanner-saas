import type { WorkoutTemplate } from "@/lib/types"

// This is the function we're exporting
export function getMockTemplates(): WorkoutTemplate[] {
  return [
    {
      id: "1",
      name: "Push/Pull/Legs for Beginners",
      description:
        "A 6-day split focusing on pushing, pulling, and leg movements, perfect for beginners looking to build muscle.",
      duration: "4 weeks, 6 days/week",
      structure: "Push/Pull/Legs/Push/Pull/Legs/Rest",
      weeks: [
        {
          week: 1,
          days: [
            {
              day: 1,
              name: "Push Day",
              exercises: [
                { name: "Bench Press", sets: 3, reps: 8 },
                { name: "Overhead Press", sets: 3, reps: 8 },
                { name: "Incline Dumbbell Press", sets: 3, reps: 10 },
                { name: "Tricep Pushdowns", sets: 3, reps: 12 },
                { name: "Lateral Raises", sets: 3, reps: 15 },
              ],
            },
            {
              day: 2,
              name: "Pull Day",
              exercises: [
                { name: "Deadlifts", sets: 3, reps: 8 },
                { name: "Pull-Ups", sets: 3, reps: 8 },
                { name: "Seated Rows", sets: 3, reps: 10 },
                { name: "Face Pulls", sets: 3, reps: 12 },
                { name: "Bicep Curls", sets: 3, reps: 12 },
              ],
            },
            {
              day: 3,
              name: "Leg Day",
              exercises: [
                { name: "Squats", sets: 3, reps: 8 },
                { name: "Romanian Deadlifts", sets: 3, reps: 10 },
                { name: "Leg Press", sets: 3, reps: 12 },
                { name: "Leg Extensions", sets: 3, reps: 15 },
                { name: "Calf Raises", sets: 3, reps: 20 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Upper/Lower Split for Intermediates",
      description: "A 4-day split alternating between upper and lower body workouts, ideal for intermediate lifters.",
      duration: "6 weeks, 4 days/week",
      structure: "Upper/Lower/Rest/Upper/Lower/Rest/Rest",
      weeks: [
        {
          week: 1,
          days: [
            {
              day: 1,
              name: "Upper Body A",
              exercises: [
                { name: "Bench Press", sets: 4, reps: 6, rpe: 8 },
                { name: "Barbell Rows", sets: 4, reps: 8, rpe: 8 },
                { name: "Overhead Press", sets: 3, reps: 8, rpe: 7 },
                { name: "Pull-Ups", sets: 3, reps: 10 },
                { name: "Tricep Pushdowns", sets: 3, reps: 12 },
                { name: "Bicep Curls", sets: 3, reps: 12 },
              ],
            },
            {
              day: 2,
              name: "Lower Body A",
              exercises: [
                { name: "Squats", sets: 4, reps: 6, rpe: 8 },
                { name: "Romanian Deadlifts", sets: 4, reps: 8, rpe: 8 },
                { name: "Leg Press", sets: 3, reps: 10 },
                { name: "Leg Curls", sets: 3, reps: 12 },
                { name: "Calf Raises", sets: 4, reps: 15 },
              ],
            },
          ],
        },
      ],
    },
  ]
}

// Let's also export the templates directly for convenience
export const mockTemplates = getMockTemplates()
