"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutTemplateCard } from "@/components/workout-template-card";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getWorkoutTemplates } from "@/lib/data-service";
import type { WorkoutTemplate } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";

// Import the template storage utility
import { saveGeneratedTemplate } from "@/lib/template-storage";

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<
    WorkoutTemplate[]
  >([]);
  const { toast } = useToast();

  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getWorkoutTemplates(user?.id);
        setTemplates(data);
      } catch (err) {
        console.error("Error loading templates:", err);
        setError("Failed to load workout templates.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const handleGenerateWorkout = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description:
          "Please enter a description of your fitness goals and preferences.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate workout plan");
      }

      const data = await response.json();
      const generatedTemplate = data.template;

      // Save the generated template to localStorage
      saveGeneratedTemplate(generatedTemplate);

      setGeneratedTemplates([generatedTemplate]);

      toast({
        title: "Workout plan generated",
        description: "Check out the AI-generated workout plan below.",
      });
    } catch (error) {
      console.error("Error generating workout:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex h-[50vh] items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allTemplates = [...templates, ...generatedTemplates];

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workout Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of pre-made workout templates or create a custom
          AI-generated plan.
        </p>
      </div>

      <Tabs defaultValue="browse">
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="generate">AI Workout Planner</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {error && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-600">
              <p>{error}</p>
            </div>
          )}

          {allTemplates.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <h2 className="text-xl font-semibold">No templates available</h2>
              <p className="mt-2 text-muted-foreground">
                Check back later for new workout templates or generate one with
                AI.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allTemplates.map((template) => (
                <WorkoutTemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Your Workout Plan</CardTitle>
              <CardDescription>
                Tell us about your fitness level, goals, available equipment,
                and time constraints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="E.g., I'm an intermediate lifter looking to build muscle. I can train 5 days a week and have access to a full gym. I prefer upper/lower splits and want to focus on my back and shoulders."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px]"
              />
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateWorkout}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Workout Plan
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {generatedTemplates.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold">
                Generated Workout Plans
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {generatedTemplates.map((template) => (
                  <WorkoutTemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
