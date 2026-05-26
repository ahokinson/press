// ---- cursor: selection + navigation primitives ----
//
// Models in `@models/cursor/*` all own a cursor: an index or focus pointer
// that travels through a list, tree, or hierarchy. They differ in what the
// pointer travels through (flat filtered list, expand/collapse tree, N-level
// drill-down, search-mode wrapper) but share a clamped cursor accessor and
// a reactive `length` that drives clamping.

export {
  createFilterableListState,
  type FilterableListConfig,
  type FilterableListSectionConfig,
  type FilterableListState,
  type SectionKey,
} from "@models/cursor/filterable.ts"
export {
  createHierarchyState,
  type HierarchyLevelConfig,
  type HierarchyState,
} from "@models/cursor/hierarchy.ts"
export {
  createSearchMode,
  type SearchableList,
  type SearchModeOptions,
  type SearchModeState,
} from "@models/cursor/search.ts"
export {
  createTreeState,
  type TreeNode,
  type TreeState,
  type TreeStateOptions,
  type VisibleTreeRow,
} from "@models/cursor/tree.ts"
export {
  type ConfirmAction,
  type ConfirmRequest,
  type ConfirmState,
  createConfirmState,
} from "@models/dialog/confirm.ts"
export { createOverlayState, type OverlayState } from "@models/dialog/overlay.ts"
export {
  type BusyHandle,
  composeTrailing,
  createStatusState,
  type StatusState,
} from "@models/feedback/status.ts"
export {
  createFocusRing,
  type FocusHandle,
  type FocusHandler,
  type FocusRing,
  type FocusRingOptions,
} from "@models/focus/ring.ts"
export {
  createNumericEditor,
  type NumericEditor,
  type NumericEditorConfig,
} from "@models/form/numeric.ts"
export {
  createFieldState,
  createValidator,
  type FieldState,
  type FieldStateOptions,
  type NumericRuleOptions,
  type ValidationRule,
} from "@models/form/validation.ts"
export { Validators } from "@models/form/validators.ts"
export { createWizard, type WizardOptions, type WizardState } from "@models/form/wizard.ts"
export {
  type CollapsibleGroup,
  type CollapsibleRow,
  CollapsibleRowKind,
  flattenGroups,
} from "@models/group/collapsible.ts"
export { createHistory, type History, type HistoryOptions } from "@models/history/stack.ts"
export {
  MATCH_KEYWORD_OR_GROUP,
  MATCH_KEYWORD_PREFIX,
  MATCH_LABEL_INFIX,
  MATCH_LABEL_PREFIX,
  MATCH_LABEL_WORD_BOUNDARY,
  SCORE_EMPTY_QUERY,
  scorePickable,
} from "@models/picker/score.ts"
export {
  createPicker,
  type Pickable,
  type PickerConfig,
  type PickerState,
} from "@models/picker/state.ts"
export { createToggleSet, type ToggleSet } from "@models/set/toggle.ts"
export {
  createTableQuery,
  type FilterPredicate,
  type SortState,
  type TableQuery,
  type TableQueryOptions,
} from "@models/table/query.ts"
