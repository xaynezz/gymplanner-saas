"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkoutDayCard } from "@/components/workout-day-card";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { getTemplateById } from "@/lib/data-service";
import { UseTemplateButton } from "@/components/use-template-button";
import type { WorkoutTemplate } from "@/lib/types";

// Import the template storage utility
import {
  getGeneratedTemplateById,
  isGeneratedTemplateId,
} from "@/lib/template-storage";

export default function TemplateDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setIsLoading(true);

        if (isGeneratedTemplateId(id)) {
          const generatedTemplate = getGeneratedTemplateById(id);
          setTemplate(generatedTemplate);
        } else {
          const data = await getTemplateById(id);
          setTemplate(data);
        }
      } catch (error) {
        console.error("Error loading template:", error);
        toast({
          title: "Error",
          description: "Failed to load template details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplate();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold">Template not found</h1>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/templates")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
      </div>
    );
  }

  // Group days by category (e.g., weekday)
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div className="container py-10">
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => router.push("/templates")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{template.name}</h1>
        <p className="mt-2 text-muted-foreground">{template.description}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <span className="text-sm font-medium">Difficulty:</span>
            <span className="ml-2">{template.difficulty}</span>
          </div>
          <div>
            <span className="text-sm font-medium">Category:</span>
            <span className="ml-2">{template.category}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {template.days.map((day) => (
          <WorkoutDayCard
            key={day.day_number}
            day={day}
            dayNumber={day.day_number}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        {user ? (
          <UseTemplateButton templateId={template.id} />
        ) : (
          <Button asChild size="lg">
            <a href="/auth/login">
              <Calendar className="mr-2 h-5 w-5" />
              Sign In to Use This Template
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
