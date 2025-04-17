"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { addWorkoutToUserSchedule } from "@/lib/data-service";
// Import the template storage utility and types
import {
  getGeneratedTemplateById,
  isGeneratedTemplateId,
} from "@/lib/template-storage";
import { createWorkoutTemplate } from "@/lib/data-service";

interface UseTemplateButtonProps {
  templateId: string;
}

export function UseTemplateButton({ templateId }: UseTemplateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Update the handleUseTemplate function:
  const handleUseTemplate = async () => {
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      let success = false;

      // Check if this is a generated template
      if (isGeneratedTemplateId(templateId)) {
        // Get the generated template
        const generatedTemplate = getGeneratedTemplateById(templateId);

        if (!generatedTemplate) {
          throw new Error("Generated template not found");
        }

        // Save the generated template to the database first
        const savedTemplateId = await createWorkoutTemplate(
          generatedTemplate,
          user.id
        );

        if (!savedTemplateId) {
          throw new Error("Failed to save generated template");
        }

        // Now add it to the user's schedule
        const startDate = new Date().toISOString().split("T")[0];
        success = await addWorkoutToUserSchedule(
          user.id,
          savedTemplateId,
          startDate
        );
      } else {
        // Regular database template
        const startDate = new Date().toISOString().split("T")[0];
        success = await addWorkoutToUserSchedule(
          user.id,
          templateId,
          startDate
        );
      }

      if (!success) {
        throw new Error("Failed to set workout");
      }

      toast({
        title: "Template Added",
        description: "The workout template has been added to your schedule.",
      });

      router.push("/schedule");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to add template to your schedule.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleUseTemplate} disabled={isLoading} size="lg">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Adding to Schedule...
        </>
      ) : (
        <>
          <Calendar className="mr-2 h-5 w-5" />
          Use This Template
        </>
      )}
    </Button>
  );
}
