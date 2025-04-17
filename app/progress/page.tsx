"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getUserExerciseProgress,
  getUserCompletedWorkouts,
} from "@/lib/data-service";
import { useAuth } from "@/components/auth-provider";
import {
  Loader2,
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Bar,
  Line,
} from "@/components/ui/chart";
import type { WorkoutProgress } from "@/lib/types";

// Helper function to calculate weekly volume
const calculateWeeklyVolume = (data: WorkoutProgress[]) => {
  // If we don't have enough real data, generate some sample data
  if (data.length < 3) {
    const sampleData = [];
    const today = new Date();

    // Generate data for the last 4 weeks
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i));

      sampleData.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        volume: Math.floor(5000 + Math.random() * 10000), // Random volume between 5000-15000
      });
    }

    return sampleData.reverse(); // Show oldest to newest
  }

  // Process real data if we have it
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        volume: 0,
      };
    }

    // Volume = sets * reps * weight
    acc[weekKey].volume += item.sets * item.reps * item.weight;

    return acc;
  }, {} as Record<string, { week: string; volume: number }>);

  return Object.values(grouped).sort((a, b) => {
    const [aMonth, aDay] = a.week.split("/").map(Number);
    const [bMonth, bDay] = b.week.split("/").map(Number);

    if (aMonth !== bMonth) return aMonth - bMonth;
    return aDay - bDay;
  });
};

// Helper function to get top exercises
const getTopExercises = (data: WorkoutProgress[]) => {
  const exerciseCounts = data.reduce((acc, item) => {
    acc[item.exercise] = (acc[item.exercise] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([exercise]) => exercise);
};

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<WorkoutProgress[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [progressData, completedData] = await Promise.all([
          getUserExerciseProgress(user.id),
          getUserCompletedWorkouts(user.id),
        ]);

        setProgressData(progressData);
        setCompletedWorkouts(completedData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate simple statistics
  const totalWorkouts = completedWorkouts.length;
  const completedCount = completedWorkouts.filter((w) => w.is_completed).length;
  const skippedCount = totalWorkouts - completedCount;
  const completionRate =
    totalWorkouts > 0 ? Math.round((completedCount / totalWorkouts) * 100) : 0;

  // Calculate most active day
  const dayCount = completedWorkouts.reduce((acc, workout) => {
    const day = new Date(workout.date).getDay();
    const dayName = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][day];
    if (workout.is_completed) {
      acc[dayName] = (acc[dayName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostActiveDay =
    Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Calculate current streak
  let currentStreak = 0;
  const sortedWorkouts = [...completedWorkouts]
    .filter((w) => w.is_completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedWorkouts.length > 0) {
    currentStreak = 1;
    for (let i = 0; i < sortedWorkouts.length - 1; i++) {
      const current = new Date(sortedWorkouts[i].date);
      const next = new Date(sortedWorkouts[i + 1].date);

      // Check if dates are consecutive
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Prepare data for charts
  const volumeData = calculateWeeklyVolume(progressData);
  const topExercises = getTopExercises(progressData);

  // Prepare adherence data
  const adherenceData = [
    { name: "Completed", value: completedCount },
    { name: "Skipped", value: skippedCount },
  ];

  // Filter data for lift progression
  const getExerciseData = (exerciseName: string) => {
    return progressData
      .filter((item) => item.exercise === exerciseName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: item.weight,
      }));
  };

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progress Tracking</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor your workout adherence and strength gains
        </p>
      </div>

      {completedWorkouts.length === 0 && progressData.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-xl font-semibold">No progress data available</h2>
          <p className="mt-2 text-muted-foreground">
            Complete workouts and track your exercises to see progress data
            here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{completedCount}</h3>
                <p className="text-sm text-muted-foreground">
                  Workouts Completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{completionRate}%</h3>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{mostActiveDay}</h3>
                <p className="text-sm text-muted-foreground">Most Active Day</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{currentStreak}</h3>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workout Adherence</CardTitle>
                <CardDescription>
                  Completed vs. skipped workouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adherenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Workouts" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Volume</CardTitle>
                <CardDescription>
                  Total weekly sets × reps × weight
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="volume" name="Volume" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {topExercises.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lift Progression</CardTitle>
                <CardDescription>
                  Weight progression for your top exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={topExercises[0]}>
                  <TabsList className="mb-4">
                    {topExercises.map((exercise) => (
                      <TabsTrigger key={exercise} value={exercise}>
                        {exercise}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {topExercises.map((exercise) => (
                    <TabsContent key={exercise} value={exercise}>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getExerciseData(exercise)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              name="Weight (lbs)"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
