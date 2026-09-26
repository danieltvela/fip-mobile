import { describe, expect, it } from 'vitest';
import { selectFilter, searchStateToQuery, setMode } from './search';

describe('search state', () => {
  it('selects a type filter and switches the facet back when toggling', () => {
    let state = selectFilter({ mode: 'type' }, 'type', 'video');
    expect(state).toEqual({ mode: 'type', type: 'video' });
    state = selectFilter(state, 'topic', 'events');
    expect(state).toEqual({ mode: 'topic', type: 'video', topic: 'events' });
  });

  it('clears a filter when the same value is selected again', () => {
    const state = selectFilter({ mode: 'type', type: 'video' }, 'type', 'video');
    expect(state.type).toBeUndefined();
  });

  it('keeps the previous facet active when only switching the mode', () => {
    const state = selectFilter({ mode: 'type', type: 'note' }, 'topic', 'agenda');
    const switched = setMode(state, 'type');
    expect(switched).toEqual({ mode: 'type', type: 'note', topic: 'agenda' });
  });

  it('maps the state to the API query', () => {
    expect(searchStateToQuery({ mode: 'type' })).toEqual({});
    expect(searchStateToQuery({ mode: 'type', type: 'note', topic: 'forums' })).toEqual({
      type: 'note',
      topic: 'forums',
    });
  });
});
