import { supabase } from "@/lib/supabase/client";
import type {
  WorkoutTemplate,
  WorkoutDay,
  Exercise,
  WorkoutProgress,
  CompletedWorkoutDetails,
} from "@/lib/types";

// Update the getWorkoutTemplates function to filter by user ID
export async function getWorkoutTemplates(
  userId?: string
): Promise<WorkoutTemplate[]> {
  let query = supabase.from("workout_templates").select("*");

  // If userId is provided, filter to show only default templates and user's templates
  if (userId) {
    // Default templates have created_by as null
    query = query.or(`created_by.is.null,created_by.eq.${userId}`);
  }

  const { data: templatesData, error: templatesError } = await query;

  if (templatesError) {
    console.error("Error fetching templates:", templatesError);
    return [];
  }

  const templates: WorkoutTemplate[] = [];

  for (const template of templatesData) {
    const { data: daysData, error: daysError } = await supabase
      .from("workout_days")
      .select("*")
      .eq("template_id", template.id)
      .order("day_number");

    if (daysError) {
      console.error("Error fetching days:", daysError);
      continue;
    }

    const days: WorkoutDay[] = [];

    for (const day of daysData) {
      // Only fetch exercises if it's not a rest day
      if (!day.is_rest_day) {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_day_id", day.id);

        if (exercisesError) {
          console.error("Error fetching exercises:", exercisesError);
          continue;
        }

        const exercises: Exercise[] = exercisesData.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rpe: exercise.rpe || undefined,
          rest_seconds: exercise.rest_seconds || undefined,
          notes: exercise.notes || undefined,
        }));

        days.push({
          id: day.id,
          day_number: day.day_number,
          name: day.name,
          is_rest_day: day.is_rest_day,
          exercises,
        });
      } else {
        // For rest days, add with empty exercises array
        days.push({
          id: day.id,
          day_number: day.day_number,
          name: day.name,
          is_rest_day: day.is_rest_day,
          exercises: [],
        });
      }
    }

    templates.push({
      id: template.id,
      name: template.name,
      description: template.description || "",
      difficulty: template.difficulty || "",
      category: template.category || "",
      days,
      created_by: template.created_by || null,
    });
  }

  return templates;
}

// Get a specific workout template by ID
export async function getTemplateById(
  id: string
): Promise<WorkoutTemplate | null> {
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (templateError) {
    console.error("Error fetching template:", templateError);
    return null;
  }

  const { data: daysData, error: daysError } = await supabase
    .from("workout_days")
    .select("*")
    .eq("template_id", id)
    .order("day_number");

  if (daysError) {
    console.error("Error fetching days:", daysError);
    return null;
  }

  const days: WorkoutDay[] = [];

  for (const day of daysData) {
    if (!day.is_rest_day) {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select("*")
        .eq("workout_day_id", day.id);

      if (exercisesError) {
        console.error("Error fetching exercises:", exercisesError);
        continue;
      }

      const exercises: Exercise[] = exercisesData.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rpe: exercise.rpe || undefined,
        rest_seconds: exercise.rest_seconds || undefined,
        notes: exercise.notes || undefined,
      }));

      days.push({
        id: day.id,
        day_number: day.day_number,
        name: day.name,
        is_rest_day: day.is_rest_day,
        exercises,
      });
    } else {
      days.push({
        id: day.id,
        day_number: day.day_number,
        name: day.name,
        is_rest_day: day.is_rest_day,
        exercises: [],
      });
    }
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description || "",
    difficulty: template.difficulty || "",
    category: template.category || "",
    days,
  };
}

// Simplified createWorkoutTemplate function now that RLS is disabled
export async function createWorkoutTemplate(
  template: Omit<WorkoutTemplate, "id"> | WorkoutTemplate,
  userId: string
): Promise<string | null> {
  try {
    // 1. Insert the template
    const { data: templateData, error: templateError } = await supabase
      .from("workout_templates")
      .insert({
        name: template.name,
        description: template.description,
        difficulty: template.difficulty,
        category: template.category,
        created_by: userId,
      })
      .select()
      .single();

    if (templateError || !templateData) {
      console.error("Error creating template:", templateError);
      return null;
    }

    const templateId = templateData.id;

    // 2. Insert days
    for (const day of template.days) {
      const { data: dayData, error: dayError } = await supabase
        .from("workout_days")
        .insert({
          template_id: templateId,
          day_number: day.day_number,
          name: day.name,
          is_rest_day: day.is_rest_day,
        })
        .select()
        .single();

      if (dayError || !dayData) {
        console.error("Error creating day:", dayError);
        continue;
      }

      const dayId = dayData.id;

      // 3. Insert exercises (only if not a rest day)
      if (!day.is_rest_day) {
        for (const exercise of day.exercises) {
          const { error: exerciseError } = await supabase
            .from("exercises")
            .insert({
              workout_day_id: dayId,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              rpe: exercise.rpe || null,
              rest_seconds: exercise.rest_seconds || null,
              notes: exercise.notes || null,
            });

          if (exerciseError) {
            console.error("Error creating exercise:", exerciseError);
          }
        }
      }
    }

    return templateId;
  } catch (error) {
    console.error("Error in createWorkoutTemplate:", error);
    return null;
  }
}

// Add a workout template to a user's schedule
export async function addWorkoutToUserSchedule(
  userId: string,
  templateId: string,
  startDate: string
): Promise<boolean> {
  // First, set all existing workouts to inactive
  const { error: updateError } = await supabase
    .from("user_workouts")
    .update({ is_active: false })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating user workouts:", updateError);
    return false;
  }

  // Then, create a new active workout
  const { error: insertError } = await supabase.from("user_workouts").insert({
    user_id: userId,
    template_id: templateId,
    start_date: startDate,
    is_active: true,
  });

  if (insertError) {
    console.error("Error inserting user workout:", insertError);
    return false;
  }

  return true;
}

// Mark a workout as completed or skipped
export async function markWorkoutAsCompleted(
  userId: string,
  workoutDayId: string,
  date: string,
  completed: boolean
): Promise<boolean> {
  const { error } = await supabase.from("completed_workouts").upsert({
    user_id: userId,
    workout_day_id: workoutDayId,
    date,
    is_completed: completed,
  });

  if (error) {
    console.error("Error marking workout as completed:", error);
    return false;
  }

  return true;
}

// Get a user's active workout
export async function getUserActiveWorkout(userId: string): Promise<any> {
  const { data, error } = await supabase
    .from("user_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Error fetching user workout:", error);
    return null;
  }

  const template = await getTemplateById(data.template_id);

  if (!template) {
    return null;
  }

  const { data: completedWorkouts, error: completedError } = await supabase
    .from("completed_workouts")
    .select("*")
    .eq("user_id", userId);

  if (completedError) {
    console.error("Error fetching completed workouts:", completedError);
    return null;
  }

  return {
    ...template,
    userId,
    startDate: data.start_date,
    completedWorkouts: completedWorkouts.map((workout) => ({
      date: workout.date,
      day_id: workout.workout_day_id,
      completed: workout.is_completed,
    })),
  };
}

// Get a user's exercise progress
export async function getUserExerciseProgress(
  userId: string
): Promise<WorkoutProgress[]> {
  const { data, error } = await supabase
    .from("exercise_progress")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching exercise progress:", error);
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    date: item.date,
    exercise: item.exercise_name,
    weight: item.weight,
    sets: item.sets,
    reps: item.reps,
  }));
}

// Get all completed workouts for a user
export async function getUserCompletedWorkouts(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("completed_workouts")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching completed workouts:", error);
    return [];
  }

  return data;
}

// Add exercise progress
export async function addExerciseProgress(
  userId: string,
  exerciseName: string,
  weight: number,
  sets: number,
  reps: number,
  date: string
): Promise<boolean> {
  const { error } = await supabase.from("exercise_progress").insert({
    user_id: userId,
    exercise_name: exerciseName,
    weight,
    sets,
    reps,
    date,
  });

  if (error) {
    console.error("Error adding exercise progress:", error);
    return false;
  }

  return true;
}

// Get completed workout details
export async function getCompletedWorkoutDetails(
  userId: string,
  workoutDayId: string,
  date: string
): Promise<CompletedWorkoutDetails | null> {
  try {
    // First get the workout day details
    const { data: dayData, error: dayError } = await supabase
      .from("workout_days")
      .select("*, workout_templates(*)")
      .eq("id", workoutDayId)
      .single();

    if (dayError || !dayData) {
      console.error("Error fetching workout day:", dayError);
      return null;
    }

    // Then get the exercise progress for this date
    const { data: progressData, error: progressError } = await supabase
      .from("exercise_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date);

    if (progressError) {
      console.error("Error fetching exercise progress:", progressError);
      return null;
    }

    // Get the exercises for this workout day
    const { data: exercisesData, error: exercisesError } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_day_id", workoutDayId);

    if (exercisesError) {
      console.error("Error fetching exercises:", exercisesError);
      return null;
    }

    // Combine the exercise template data with any progress data
    const exercises = exercisesData.map((exercise) => {
      // Find matching progress data if any
      const progress = progressData.find(
        (p) => p.exercise_name.toLowerCase() === exercise.name.toLowerCase()
      );

      return {
        id: exercise.id,
        name: exercise.name,
        sets: progress?.sets || exercise.sets,
        reps: progress?.reps || exercise.reps,
        weight: progress?.weight || undefined,
        rpe: exercise.rpe || undefined,
        rest_seconds: exercise.rest_seconds || undefined,
        notes: exercise.notes || undefined,
      };
    });

    return {
      id: workoutDayId,
      name: dayData.name,
      date: date,
      exercises,
    };
  } catch (error) {
    console.error("Error getting completed workout details:", error);
    return null;
  }
}

// Update exercises for a workout day
export async function updateWorkoutDayExercises(
  workoutDayId: string,
  exercises: Exercise[],
  userId: string,
  date?: string
): Promise<boolean> {
  try {
    // Update each exercise in the database
    for (const exercise of exercises) {
      if (!exercise.id) {
        console.error("Exercise ID is missing, cannot update");
        continue;
      }

      // Update the exercise in the exercises table
      const { error: updateError } = await supabase
        .from("exercises")
        .update({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rpe: exercise.rpe || null,
          rest_seconds: exercise.rest_seconds || null,
          notes: exercise.notes || null,
        })
        .eq("id", exercise.id);

      if (updateError) {
        console.error("Error updating exercise:", updateError);
        return false;
      }

      // If a date is provided, also record this as exercise progress
      if (date && userId) {
        // Check if progress already exists for this exercise on this date
        const { data: existingProgress, error: checkError } = await supabase
          .from("exercise_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("exercise_name", exercise.name)
          .eq("date", date)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking existing progress:", checkError);
          continue;
        }

        // If progress exists, update it; otherwise insert new progress
        if (existingProgress) {
          const { error: progressUpdateError } = await supabase
            .from("exercise_progress")
            .update({
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight || 0,
            })
            .eq("id", existingProgress.id);

          if (progressUpdateError) {
            console.error(
              "Error updating exercise progress:",
              progressUpdateError
            );
          }
        } else if (exercise.weight) {
          // Only insert progress if weight is provided
          const { error: progressInsertError } = await supabase
            .from("exercise_progress")
            .insert({
              user_id: userId,
              exercise_name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              date: date,
            });

          if (progressInsertError) {
            console.error(
              "Error inserting exercise progress:",
              progressInsertError
            );
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error in updateWorkoutDayExercises:", error);
    return false;
  }
}
