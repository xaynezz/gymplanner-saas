import type { WorkoutTemplate } from "@/lib/types"

const STORAGE_KEY = "gym-planner-generated-templates"

// Save a generated template to localStorage
export function saveGeneratedTemplate(template: WorkoutTemplate): void {
  if (typeof window === "undefined") return

  try {
    // Get existing templates
    const existingTemplatesJSON = localStorage.getItem(STORAGE_KEY)
    const existingTemplates: WorkoutTemplate[] = existingTemplatesJSON ? JSON.parse(existingTemplatesJSON) : []

    // Check if template already exists
    const templateExists = existingTemplates.some((t) => t.id === template.id)

    // If it doesn't exist, add it
    if (!templateExists) {
      const updatedTemplates = [...existingTemplates, template]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates))
    }
  } catch (error) {
    console.error("Error saving generated template:", error)
  }
}

// Get all generated templates from localStorage
export function getGeneratedTemplates(): WorkoutTemplate[] {
  if (typeof window === "undefined") return []

  try {
    const templatesJSON = localStorage.getItem(STORAGE_KEY)
    return templatesJSON ? JSON.parse(templatesJSON) : []
  } catch (error) {
    console.error("Error retrieving generated templates:", error)
    return []
  }
}

// Get a specific generated template by ID
export function getGeneratedTemplateById(id: string): WorkoutTemplate | null {
  if (typeof window === "undefined") return null

  try {
    const templates = getGeneratedTemplates()
    return templates.find((template) => template.id === id) || null
  } catch (error) {
    console.error("Error retrieving generated template:", error)
    return null
  }
}

// Check if a template ID is for a generated template
export function isGeneratedTemplateId(id: string): boolean {
  return id.startsWith("generated-")
}
