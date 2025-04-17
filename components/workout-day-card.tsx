import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WorkoutDay } from "@/lib/types"

interface WorkoutDayCardProps {
  day: WorkoutDay
  dayNumber: number
}

export function WorkoutDayCard({ day, dayNumber }: WorkoutDayCardProps) {
  // Map day number to day name
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const dayName = dayNames[day.day_number - 1] || `Day ${day.day_number}`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {dayName}: {day.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {day.is_rest_day ? (
          <div className="flex h-20 items-center justify-center">
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Rest Day
            </Badge>
          </div>
        ) : (
          <ul className="space-y-4">
            {day.exercises.map((exercise, index) => (
              <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="font-medium">{exercise.name}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/10">
                    {exercise.sets} sets
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10">
                    {exercise.reps} reps
                  </Badge>
                  {exercise.rpe && (
                    <Badge variant="outline" className="bg-primary/10">
                      RPE {exercise.rpe}
                    </Badge>
                  )}
                  {exercise.rest_seconds && (
                    <Badge variant="outline" className="bg-primary/10">
                      Rest: {exercise.rest_seconds}s
                    </Badge>
                  )}
                </div>
                {exercise.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">Notes:</span> {exercise.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
