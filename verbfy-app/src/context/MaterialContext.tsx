import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Material } from '../types/materials';

// State interface
interface MaterialState {
  materials: Material[];
  loading: boolean;
  error: string | null;
  selectedMaterial: Material | null;
}

// Action types
type MaterialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MATERIALS'; payload: Material[] }
  | { type: 'ADD_MATERIAL'; payload: Material }
  | { type: 'UPDATE_MATERIAL'; payload: Material }
  | { type: 'DELETE_MATERIAL'; payload: string }
  | { type: 'SET_SELECTED_MATERIAL'; payload: Material | null }
  | { type: 'CLEAR_MATERIALS' };

// Initial state
const initialState: MaterialState = {
  materials: [],
  loading: false,
  error: null,
  selectedMaterial: null
};

// Reducer
function materialReducer(state: MaterialState, action: MaterialAction): MaterialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_MATERIALS':
      return { ...state, materials: action.payload };
    
    case 'ADD_MATERIAL':
      return {
        ...state,
        materials: [action.payload, ...state.materials]
      };
    
    case 'UPDATE_MATERIAL':
      return {
        ...state,
        materials: state.materials.map(material =>
          material._id === action.payload._id ? action.payload : material
        )
      };
    
    case 'DELETE_MATERIAL':
      return {
        ...state,
        materials: state.materials.filter(material => material._id !== action.payload)
      };
    
    case 'SET_SELECTED_MATERIAL':
      return { ...state, selectedMaterial: action.payload };
    
    case 'CLEAR_MATERIALS':
      return { ...state, materials: [] };
    
    default:
      return state;
  }
}

// Context interface
interface MaterialContextType {
  state: MaterialState;
  dispatch: React.Dispatch<MaterialAction>;
  // Convenience methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  deleteMaterial: (materialId: string) => void;
  setSelectedMaterial: (material: Material | null) => void;
  clearMaterials: () => void;
}

// Create context
const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

// Provider component
interface MaterialProviderProps {
  children: ReactNode;
}

export function MaterialProvider({ children }: MaterialProviderProps) {
  const [state, dispatch] = useReducer(materialReducer, initialState);

  // Convenience methods
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setMaterials = (materials: Material[]) => {
    dispatch({ type: 'SET_MATERIALS', payload: materials });
  };

  const addMaterial = (material: Material) => {
    dispatch({ type: 'ADD_MATERIAL', payload: material });
  };

  const updateMaterial = (material: Material) => {
    dispatch({ type: 'UPDATE_MATERIAL', payload: material });
  };

  const deleteMaterial = (materialId: string) => {
    dispatch({ type: 'DELETE_MATERIAL', payload: materialId });
  };

  const setSelectedMaterial = (material: Material | null) => {
    dispatch({ type: 'SET_SELECTED_MATERIAL', payload: material });
  };

  const clearMaterials = () => {
    dispatch({ type: 'CLEAR_MATERIALS' });
  };

  const value: MaterialContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    setSelectedMaterial,
    clearMaterials
  };

  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
}

// Custom hook to use material context
export function useMaterial() {
  const context = useContext(MaterialContext);
  
  if (context === undefined) {
    throw new Error('useMaterial must be used within a MaterialProvider');
  }
  
  return context;
} 