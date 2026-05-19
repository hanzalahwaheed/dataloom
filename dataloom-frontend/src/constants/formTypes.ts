/**
 * Form-type identifiers shared between MenuNavbar's items config and
 * useForm's active-form state. The string values are observable — they're
 * the keys MenuNavbar's `activeFormConfig` looks up — so don't change them
 * casually; the object keys are just programmer-facing labels.
 *
 * @module constants/formTypes
 */

export const FORM_TYPES = {
  filter: "FilterForm",
  sort: "SortForm",
  dropDuplicate: "DropDuplicateForm",
  groupBy: "GroupByForm",
  castType: "CastDataTypeForm",
  trimWhitespace: "TrimWhitespaceForm",
  advQuery: "AdvQueryFilterForm",
  pivotTable: "PivotTableForm",
  melt: "MeltForm",
  logs: "Logs",
  checkpoints: "Checkpoints",
} as const;

export type FormType = (typeof FORM_TYPES)[keyof typeof FORM_TYPES];
