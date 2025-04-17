import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Dumbbell, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Welcome to GymPlanner</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Dumbbell className="h-8 w-8 text-primary" />
            <CardTitle>Workout Templates</CardTitle>
            <CardDescription>
              Browse or generate workout templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Choose from pre-made workout templates or create a custom
              AI-generated plan based on your goals.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/templates">Browse Templates</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Calendar className="h-8 w-8 text-primary" />
            <CardTitle>Your Schedule</CardTitle>
            <CardDescription>
              View and manage your workout schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              See your upcoming workouts, mark sessions as complete, and make
              adjustments to your plan.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/schedule">View Schedule</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary" />
            <CardTitle>Track Progress</CardTitle>
            <CardDescription>Monitor your fitness journey</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Track your workout adherence, lift progression, and weekly volume
              to see your improvements.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/progress">View Progress</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
