import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import type { WorkoutTemplate } from "@/lib/types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `
      You are a professional fitness coach specializing in creating personalized workout plans.
      Generate a detailed workout template based on the user's request.
      
      The response MUST be a valid JSON object with the following structure:
      {
        "name": "Name of the workout plan",
        "description": "Detailed description of the workout plan",
        "difficulty": "Beginner, Intermediate, or Advanced",
        "category": "Strength, Hypertrophy, Endurance, etc.",
        "days": [
          {
            "day_number": 1,
            "name": "Day name (e.g., Push Day, Upper Body, etc.)",
            "is_rest_day": false,
            "exercises": [
              {
                "name": "Exercise name",
                "sets": 3,
                "reps": 10,
                "rpe": 8 (optional),
                "rest_seconds": 60 (optional),
                "notes": "Any specific notes" (optional)
              }
              // More exercises...
            ]
          }
          // More days...
        ]
      }
      
      Ensure the workout plan is tailored to the user's specific needs and goals.
      There needs to be 7 days, representing Monday to Sunday.
      For rest days, set "is_rest_day" to true and include an empty exercises array.
      For exercise days, set "is_rest_day" to false and include the exercises.
      In a request, user may send their current workout routine and ask for a change in the plan.
      In that case, when you create the workout plan, you should consider the current workout routine and ensure that his changes and needs are met.
      The workout plan should be comprehensive and easy to follow.
      DO NOT include any explanations or text outside the JSON object.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate workout plan" },
        { status: 500 }
      );
    }

    // Extract JSON from the response
    let workoutTemplate: WorkoutTemplate;
    try {
      // Find JSON in the response (in case there's any text before or after)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const jsonStr = jsonMatch[0];
      const parsedTemplate = JSON.parse(jsonStr);

      // Add a generated ID
      workoutTemplate = {
        ...parsedTemplate,
        id: `generated-${Date.now()}`,
      };
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return NextResponse.json(
        { error: "Failed to parse workout plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: workoutTemplate });
  } catch (error) {
    console.error("Error generating workout plan:", error);
    return NextResponse.json(
      { error: "Failed to generate workout plan" },
      { status: 500 }
    );
  }
}
