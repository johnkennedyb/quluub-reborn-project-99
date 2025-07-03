
import { useToast as useShadcnToast, toast as shadcnToast } from "@/hooks/use-toast";

// Re-export the toast components from the hooks directory
export const useToast = useShadcnToast;
export const toast = shadcnToast;
