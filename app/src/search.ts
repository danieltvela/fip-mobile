import { MaterialQuery, MaterialTopic, MaterialType, SearchMode } from '@fip/shared';

export interface SearchState {
  mode: SearchMode;
  type?: MaterialType;
  topic?: MaterialTopic;
}

/** Selecting the active filter again clears it; the other facet is kept as-is. */
export function selectFilter(state: SearchState, mode: SearchMode, value: MaterialType | MaterialTopic): SearchState {
  if (mode === 'type') {
    const type = value as MaterialType;
    return { ...state, mode, type: state.type === type ? undefined : type };
  }
  const topic = value as MaterialTopic;
  return { ...state, mode, topic: state.topic === topic ? undefined : topic };
}

export function setMode(state: SearchState, mode: SearchMode): SearchState {
  return mode === state.mode ? state : { ...state, mode };
}

export function searchStateToQuery(state: SearchState): MaterialQuery {
  return { type: state.type, topic: state.topic };
}

