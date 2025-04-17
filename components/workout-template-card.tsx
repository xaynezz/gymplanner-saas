import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import type { WorkoutTemplate } from "@/lib/types";

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate;
  currentUserId?: string;
}

export function WorkoutTemplateCard({
  template,
  currentUserId,
}: WorkoutTemplateCardProps) {
  // Calculate total days and exercises
  const totalDays = template.days.length;
  const totalExercises = template.days.reduce(
    (sum, day) => (day.is_rest_day ? sum : sum + day.exercises.length),
    0
  );

  // Count rest days
  const restDays = template.days.filter((day) => day.is_rest_day).length;

  // Check if this is a default template or user's own template
  const isDefaultTemplate =
    template.created_by == null && !template.id.startsWith("generated-");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{template.name}</CardTitle>
          <div className="flex gap-1">
            {isDefaultTemplate ? (
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                Default
              </Badge>
            ) : (
              <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
                Generated
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="outline">{template.difficulty}</Badge>
          <Badge variant="outline">{template.category}</Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Days:</span>
            <span>{totalDays}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rest Days:</span>
            <span>{restDays}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Exercises:</span>
            <span>{totalExercises}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/templates/${template.id}`}>
            <Calendar className="mr-2 h-4 w-4" />
            View Template
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
