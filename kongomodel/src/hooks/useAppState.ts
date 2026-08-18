// This file now re-exports from the shared context for backward compatibility.
// All state is managed by AppStateContext to ensure components share the same state.
export { useAppState, AppStateProvider } from '../context/AppStateContext';
