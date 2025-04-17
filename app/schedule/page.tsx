"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  MoreHorizontal,
  SkipForward,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import {
  getUserActiveWorkout,
  markWorkoutAsCompleted,
  getCompletedWorkoutDetails,
  updateWorkoutDayExercises,
} from "@/lib/data-service";
import type {
  UserWorkout,
  WorkoutDay,
  CompletedWorkoutDetails,
  Exercise,
} from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { saveGeneratedTemplate } from "@/lib/template-storage";
import { createEvents } from "ics";
import { saveAs } from "file-saver";

// Helper function to get week dates based on an offset
const getWeekDates = (weekOffset = 0) => {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

  // Apply week offset
  const mondayOfTargetWeek = new Date(today);
  mondayOfTargetWeek.setDate(diff + weekOffset * 7);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(mondayOfTargetWeek);
    date.setDate(mondayOfTargetWeek.getDate() + i);
    weekDates.push(date);
  }

  return weekDates;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDayName = (date: Date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const formatWeekRange = (dates: Date[]) => {
  if (dates.length === 0) return "";

  const firstDay = dates[0];
  const lastDay = dates[dates.length - 1];

  const firstMonth = firstDay.toLocaleDateString("en-US", { month: "short" });
  const lastMonth = lastDay.toLocaleDateString("en-US", { month: "short" });

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDay.getDate()} - ${lastDay.getDate()}, ${lastDay.getFullYear()}`;
  } else {
    return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}, ${lastDay.getFullYear()}`;
  }
};

export default function SchedulePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState(getWeekDates(0));
  const [promptInput, setPromptInput] = useState("");
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDay | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedExercises, setEditedExercises] = useState<Exercise[]>([]);
  const [userWorkout, setUserWorkout] = useState<UserWorkout | null>(null);
  const [completedWorkoutDetails, setCompletedWorkoutDetails] = useState<
    Record<string, CompletedWorkoutDetails>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const getTemplateContext = () => {
    if (!userWorkout) return "";

    const lines: string[] = [];

    lines.push(`Current workout template: "${userWorkout.name}".`);
    lines.push(`Description: ${userWorkout.description}`);
    if (userWorkout.difficulty)
      lines.push(`Difficulty: ${userWorkout.difficulty}`);
    if (userWorkout.category) lines.push(`Category: ${userWorkout.category}`);
    lines.push(`Days: ${userWorkout.days?.length || 0}`);

    if (userWorkout.days) {
      userWorkout.days.forEach((day, i) => {
        lines.push(`Day ${i + 1}: ${day.name}`);
        if (day.exercises && day.exercises.length > 0) {
          day.exercises.forEach((ex, j) => {
            lines.push(
              `  Exercise ${j + 1}: ${ex.name}, ${ex.sets} sets x ${
                ex.reps
              } reps` +
                (ex.weight ? ` @ ${ex.weight} lbs` : "") +
                (ex.rpe ? ` RPE ${ex.rpe}` : "")
            );
          });
        }
      });
    }

    return lines.join("\n");
  };

  // Update week dates when week offset changes
  useEffect(() => {
    setWeekDates(getWeekDates(weekOffset));
  }, [weekOffset]);

  useEffect(() => {
    async function loadUserWorkout() {
      if (!user) return;

      try {
        const workout = await getUserActiveWorkout(user.id);
        setUserWorkout(workout);

        // If we have a workout and completed workouts, fetch their details
        if (
          workout &&
          workout.completedWorkouts &&
          workout.completedWorkouts.length > 0
        ) {
          const details: Record<string, CompletedWorkoutDetails> = {};

          for (const completedWorkout of workout.completedWorkouts) {
            if (completedWorkout.completed) {
              const workoutDetails = await getCompletedWorkoutDetails(
                user.id,
                completedWorkout.day_id,
                completedWorkout.date
              );

              if (workoutDetails) {
                details[`${completedWorkout.date}`] = workoutDetails;
              }
            }
          }

          setCompletedWorkoutDetails(details);
        }
      } catch (error) {
        console.error("Error loading user workout:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserWorkout();
  }, [user]);

  // Get workout for a specific date
  const getWorkoutForDate = (date: Date) => {
    if (!userWorkout) return null;

    // Calculate days since start date
    const startDate = new Date(userWorkout.startDate);
    const diffTime = Math.abs(date.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Check if days property exists directly on userWorkout
    if (userWorkout.days && Array.isArray(userWorkout.days)) {
      const totalDays = userWorkout.days.length;
      if (totalDays === 0) return null;

      const cycleDay = diffDays % totalDays;
      return userWorkout.days[cycleDay] || null;
    }

    // Check if weeks property exists and has valid structure
    if (
      !userWorkout.weeks ||
      !Array.isArray(userWorkout.weeks) ||
      userWorkout.weeks.length === 0
    ) {
      return null;
    }

    // Calculate which week and day in the template
    let totalDays = 0;
    const allDays: WorkoutDay[] = [];

    // Collect all days from all weeks
    for (const week of userWorkout.weeks) {
      if (week.days && Array.isArray(week.days)) {
        totalDays += week.days.length;
        allDays.push(...week.days);
      }
    }

    if (totalDays === 0) return null;

    const cycleDay = diffDays % totalDays;
    return allDays[cycleDay] || null;
  };

  const isWorkoutCompleted = (date: Date) => {
    if (!userWorkout || !userWorkout.completedWorkouts) return false;
    const dateStr = date.toISOString().split("T")[0];
    return userWorkout.completedWorkouts.some(
      (workout) => workout.date === dateStr && workout.completed
    );
  };

  const isWorkoutSkipped = (date: Date) => {
    if (!userWorkout || !userWorkout.completedWorkouts) return false;
    const dateStr = date.toISOString().split("T")[0];
    return userWorkout.completedWorkouts.some(
      (workout) => workout.date === dateStr && !workout.completed
    );
  };

  // Get completed workout details for a date if available
  const getCompletedWorkoutForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return completedWorkoutDetails[dateStr] || null;
  };

  const handleMarkComplete = async (date: Date, workout: WorkoutDay) => {
    if (!user || !userWorkout) return;

    try {
      const dateStr = date.toISOString().split("T")[0];
      // In a real app, we would need to map the workout day to the actual workout_day_id
      // For now, we'll use a placeholder
      const workoutDayId = workout.id || workout.day.toString(); // Use ID if available, otherwise day number

      const success = await markWorkoutAsCompleted(
        user.id,
        workoutDayId,
        dateStr,
        true
      );

      if (success) {
        toast({
          title: "Workout Completed",
          description: `Workout for ${formatDate(date)} marked as complete.`,
        });

        // Refresh user workout data
        const updatedWorkout = await getUserActiveWorkout(user.id);
        setUserWorkout(updatedWorkout);

        // Fetch the completed workout details
        const workoutDetails = await getCompletedWorkoutDetails(
          user.id,
          workoutDayId,
          dateStr
        );
        if (workoutDetails) {
          setCompletedWorkoutDetails((prev) => ({
            ...prev,
            [dateStr]: workoutDetails,
          }));
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark workout as complete.",
        variant: "destructive",
      });
    }
  };

  const handleSkipWorkout = async (date: Date, workout: WorkoutDay) => {
    if (!user || !userWorkout) return;

    try {
      const dateStr = date.toISOString().split("T")[0];
      // In a real app, we would need to map the workout day to the actual workout_day_id
      const workoutDayId = workout.id || workout.day.toString(); // Use ID if available, otherwise day number

      const success = await markWorkoutAsCompleted(
        user.id,
        workoutDayId,
        dateStr,
        false
      );

      if (success) {
        toast({
          title: "Workout Skipped",
          description: `Workout for ${formatDate(date)} marked as skipped.`,
        });

        // Refresh user workout data
        const updatedWorkout = await getUserActiveWorkout(user.id);
        setUserWorkout(updatedWorkout);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark workout as skipped.",
        variant: "destructive",
      });
    }
  };

  const handleEditWorkout = (workout: WorkoutDay, date: Date) => {
    setSelectedWorkout(workout);
    setSelectedDate(date);

    // Check if this is a completed workout with details
    const dateStr = date.toISOString().split("T")[0];
    const completedWorkout = completedWorkoutDetails[dateStr];

    if (completedWorkout) {
      setEditedExercises([...completedWorkout.exercises]);
    } else {
      setEditedExercises(workout.exercises ? [...workout.exercises] : []);
    }

    setIsEditDialogOpen(true);
  };

  const handleSaveEditedWorkout = async () => {
    if (!selectedWorkout || !user) return;

    setIsSaving(true);

    try {
      const workoutDayId = selectedWorkout.id || "";

      if (!workoutDayId) {
        throw new Error("Workout day ID is missing");
      }

      // Determine if we need to save as a completed workout
      const isCompleted = selectedDate
        ? isWorkoutCompleted(selectedDate)
        : false;
      const dateStr = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : undefined;

      // Update the exercises in the database
      const success = await updateWorkoutDayExercises(
        workoutDayId,
        editedExercises,
        user.id,
        isCompleted ? dateStr : undefined
      );

      if (success) {
        toast({
          title: "Workout Updated",
          description: "Your workout has been updated successfully.",
        });

        // Refresh the data
        const updatedWorkout = await getUserActiveWorkout(user.id);
        setUserWorkout(updatedWorkout);

        // If this was a completed workout, refresh its details
        if (isCompleted && dateStr) {
          const workoutDetails = await getCompletedWorkoutDetails(
            user.id,
            workoutDayId,
            dateStr
          );
          if (workoutDetails) {
            setCompletedWorkoutDetails((prev) => ({
              ...prev,
              [dateStr]: workoutDetails,
            }));
          }
        }

        setIsEditDialogOpen(false);
      } else {
        throw new Error("Failed to update workout");
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      toast({
        title: "Error",
        description: "Failed to save workout changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExercise = (index: number, field: string, value: any) => {
    const updatedExercises = [...editedExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setEditedExercises(updatedExercises);
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!promptInput.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a valid request to generate a workout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPrompt(true);

    try {
      const paddedPrompt = `${promptInput.trim()}\n\n---\n\nContext:\n${getTemplateContext()}`;

      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: paddedPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate workout plan");
      }

      const data = await response.json();
      const generatedTemplate = data.template;

      saveGeneratedTemplate(generatedTemplate);
      router.push(`/templates/${generatedTemplate.id}`);
    } catch (error) {
      console.error("Error generating workout:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPrompt(false);
    }
  };

  const handleExportToGoogleCalendar = async () => {
    if (!userWorkout) return;

    const events = [];
    const startDate = new Date(userWorkout.startDate);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const workout = getWorkoutForDate(date);
      if (!workout) continue;

      const title = workout.name || "Workout";
      const description =
        workout.exercises
          ?.map((ex) => {
            return `${ex.name} — ${ex.sets} sets x ${ex.reps} reps${
              ex.rpe ? ` @ RPE ${ex.rpe}` : ""
            }`;
          })
          .join("\n") || "";

      const [year, month, day] = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
      ];

      events.push({
        start: [year, month, day, 9, 0], // 9AM default
        duration: { hours: 1 },
        title,
        description,
      });
    }

    createEvents(events, (error, value) => {
      if (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to generate calendar file.",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
      saveAs(blob, "workout_schedule.ics");

      toast({
        title: "Calendar Exported",
        description: "Download complete. Import it into Google Calendar.",
      });
    });
  };

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Workout Schedule</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your upcoming workouts
          </p>
        </div>
        <Button onClick={handleExportToGoogleCalendar}>
          <Calendar className="mr-2 h-4 w-4" />
          Export to Google Calendar
        </Button>
      </div>

      {!userWorkout ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold">No active workout plan</h2>
          <p className="mt-2 text-muted-foreground">
            You don't have an active workout plan. Visit the Templates page to
            create one.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={() => router.push("/templates")}>
              Browse Templates
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Workout Plan</CardTitle>
              <CardDescription>
                You're currently following the "{userWorkout.name}" template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">
                    {userWorkout.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  {userWorkout.difficulty && (
                    <div>
                      <span className="text-sm font-medium">Difficulty:</span>
                      <Badge variant="outline" className="ml-2">
                        {userWorkout.difficulty}
                      </Badge>
                    </div>
                  )}

                  {userWorkout.category && (
                    <div>
                      <span className="text-sm font-medium">Category:</span>
                      <Badge variant="outline" className="ml-2">
                        {userWorkout.category}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <span className="text-sm font-medium">Started:</span>
                    <span className="ml-2">
                      {new Date(userWorkout.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Adjust Your Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePromptSubmit} className="flex gap-2">
                <Input
                  placeholder="E.g., 'I missed yesterday' or 'Change my next 3 workouts to lower body'"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isProcessingPrompt}>
                  {isProcessingPrompt ? "Processing..." : "Update"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={handlePreviousWeek}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous Week
            </Button>

            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {formatWeekRange(weekDates)}
              </h2>
              {weekOffset !== 0 && (
                <Button
                  variant="link"
                  onClick={handleCurrentWeek}
                  className="mt-1 h-auto p-0"
                >
                  Return to current week
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={handleNextWeek}>
              Next Week
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date, index) => {
              const workout = getWorkoutForDate(date);
              const isCompleted = isWorkoutCompleted(date);
              const isSkipped = isWorkoutSkipped(date);
              const completedWorkout = isCompleted
                ? getCompletedWorkoutForDate(date)
                : null;

              return (
                <Card
                  key={index}
                  className={`${
                    isCompleted
                      ? "border-green-500"
                      : isSkipped
                      ? "border-yellow-500"
                      : ""
                  }`}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold">
                          {getDayName(date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(date)}
                        </div>
                      </div>
                      {workout && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isCompleted && !isSkipped && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMarkComplete(date, workout)
                                }
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Complete
                              </DropdownMenuItem>
                            )}
                            {!isCompleted && !isSkipped && (
                              <DropdownMenuItem
                                onClick={() => handleSkipWorkout(date, workout)}
                              >
                                <SkipForward className="mr-2 h-4 w-4" />
                                Skip Workout
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleEditWorkout(workout, date)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Workout
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {isCompleted && completedWorkout ? (
                      // Show completed workout data
                      <div>
                        <div className="mb-2 font-medium">
                          {completedWorkout.name}
                        </div>
                        <ul className="space-y-2 text-xs">
                          {completedWorkout.exercises.map((exercise, i) => (
                            <li key={i} className="rounded-md bg-muted p-1.5">
                              <div className="font-medium">{exercise.name}</div>
                              <div className="flex flex-wrap gap-1 text-muted-foreground">
                                <span>
                                  {exercise.sets}×{exercise.reps}
                                </span>
                                {exercise.weight && (
                                  <span>{exercise.weight} lbs</span>
                                )}
                                {exercise.rpe && (
                                  <span> @ RPE {exercise.rpe}</span>
                                )}
                                <span>
                                  {" "}
                                  • Rest:{" "}
                                  {exercise.rest_seconds ||
                                    Math.floor(60 + Math.random() * 60)}
                                  s
                                </span>
                              </div>
                              {exercise.notes && (
                                <div className="mt-1 text-xs italic text-muted-foreground">
                                  {exercise.notes}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                        <Badge
                          variant="outline"
                          className="mt-2 bg-green-500/10 text-green-500"
                        >
                          Completed
                        </Badge>
                      </div>
                    ) : workout && !isSkipped ? (
                      // Show template workout data
                      <div>
                        <div className="mb-2 font-medium">{workout.name}</div>
                        <ul className="space-y-2 text-xs">
                          {workout.exercises &&
                            workout.exercises.map((exercise, i) => (
                              <li key={i} className="rounded-md bg-muted p-1.5">
                                <div className="font-medium">
                                  {exercise.name}
                                </div>
                                <div className="flex flex-wrap gap-1 text-muted-foreground">
                                  <span>
                                    {exercise.sets}×{exercise.reps}
                                  </span>
                                  {exercise.rpe && (
                                    <span> @ RPE {exercise.rpe}</span>
                                  )}
                                  <span>
                                    {" "}
                                    • Rest:{" "}
                                    {exercise.rest_seconds ||
                                      Math.floor(60 + Math.random() * 60)}
                                    s
                                  </span>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : isSkipped ? (
                      <div>
                        <div className="mb-2 font-medium">
                          {workout?.name || "Workout"}
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-2 bg-yellow-500/10 text-yellow-500"
                        >
                          Skipped
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Rest Day
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Workout</DialogTitle>
                <DialogDescription>
                  Make changes to your workout for {selectedWorkout?.name}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {editedExercises.map((exercise, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={exercise.name}
                        onChange={(e) =>
                          handleUpdateExercise(index, "name", e.target.value)
                        }
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/3">
                        <label className="text-xs">Sets</label>
                        <Input
                          type="number"
                          value={exercise.sets || ""}
                          onChange={(e) =>
                            handleUpdateExercise(
                              index,
                              "sets",
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : ""
                            )
                          }
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="text-xs">Reps</label>
                        <Input
                          type="number"
                          value={exercise.reps || ""}
                          onChange={(e) =>
                            handleUpdateExercise(
                              index,
                              "reps",
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : ""
                            )
                          }
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="text-xs">RPE (optional)</label>
                        <Input
                          type="number"
                          value={exercise.rpe || ""}
                          onChange={(e) =>
                            handleUpdateExercise(
                              index,
                              "rpe",
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : ""
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-xs">
                          Weight (lbs, optional)
                        </label>
                        <Input
                          type="number"
                          value={exercise.weight || ""}
                          onChange={(e) =>
                            handleUpdateExercise(
                              index,
                              "weight",
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : ""
                            )
                          }
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs">
                          Rest (seconds, optional)
                        </label>
                        <Input
                          type="number"
                          value={exercise.rest_seconds || ""}
                          onChange={(e) =>
                            handleUpdateExercise(
                              index,
                              "rest_seconds",
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : ""
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs">Notes (optional)</label>
                      <Input
                        value={exercise.notes || ""}
                        onChange={(e) =>
                          handleUpdateExercise(index, "notes", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEditedWorkout} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
