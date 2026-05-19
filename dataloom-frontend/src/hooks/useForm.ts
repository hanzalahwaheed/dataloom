/**
 * Hook to manage active form state in MenuNavbar.
 * @module hooks/useForm
 */
import { useState, useCallback } from "react";

interface UseFormResult {
  /** The currently open form, or `null` when none is open. */
  activeForm: string | null;
  /** Open the given form. */
  openForm: (formType: string) => void;
  /** Close whatever form is open. */
  closeForm: () => void;
  /** Whether the given form is the one currently open. */
  isActive: (formType: string) => boolean;
}

/** Manages the currently active form. */
export function useForm(initialForm: string | null = null): UseFormResult {
  const [activeForm, setActiveForm] = useState<string | null>(initialForm);

  const openForm = useCallback((formType: string) => {
    setActiveForm(formType);
  }, []);

  const closeForm = useCallback(() => {
    setActiveForm(null);
  }, []);

  const isActive = useCallback(
    (formType: string) => {
      return activeForm === formType;
    },
    [activeForm],
  );

  return {
    activeForm,
    openForm,
    closeForm,
    isActive,
  };
}
