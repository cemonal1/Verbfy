import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../lib/api';
import {
  AdminUser,
  AdminMaterial,
  AdminPayment,
  AdminLog,
  AdminOverview,
  UserFilters,
  MaterialFilters,
  PaymentFilters,
  LogFilters,
  UpdateUserRoleData,
  UpdateUserStatusData,
  ApproveMaterialData,
  RefundPaymentData
} from '../types/admin';

// State interface
interface AdminState {
  // Overview data
  overview: AdminOverview | null;
  overviewLoading: boolean;
  
  // Users
  users: AdminUser[];
  usersLoading: boolean;
  usersPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  selectedUser: AdminUser | null;
  
  // Materials
  materials: AdminMaterial[];
  materialsLoading: boolean;
  materialsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  selectedMaterial: AdminMaterial | null;
  
  // Payments
  payments: AdminPayment[];
  paymentsLoading: boolean;
  paymentsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  selectedPayment: AdminPayment | null;
  
  // Logs
  logs: AdminLog[];
  logsLoading: boolean;
  logsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  
  // Filters
  userFilters: UserFilters;
  materialFilters: MaterialFilters;
  paymentFilters: PaymentFilters;
  logFilters: LogFilters;
}

// Action types
type AdminAction =
  | { type: 'SET_OVERVIEW'; payload: AdminOverview }
  | { type: 'SET_OVERVIEW_LOADING'; payload: boolean }
  | { type: 'SET_USERS'; payload: { users: AdminUser[]; pagination: any } }
  | { type: 'SET_USERS_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_USER'; payload: AdminUser | null }
  | { type: 'SET_MATERIALS'; payload: { materials: AdminMaterial[]; pagination: any } }
  | { type: 'SET_MATERIALS_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_MATERIAL'; payload: AdminMaterial | null }
  | { type: 'SET_PAYMENTS'; payload: { payments: AdminPayment[]; pagination: any } }
  | { type: 'SET_PAYMENTS_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_PAYMENT'; payload: AdminPayment | null }
  | { type: 'SET_LOGS'; payload: { logs: AdminLog[]; pagination: any } }
  | { type: 'SET_LOGS_LOADING'; payload: boolean }
  | { type: 'SET_USER_FILTERS'; payload: UserFilters }
  | { type: 'SET_MATERIAL_FILTERS'; payload: MaterialFilters }
  | { type: 'SET_PAYMENT_FILTERS'; payload: PaymentFilters }
  | { type: 'SET_LOG_FILTERS'; payload: LogFilters }
  | { type: 'UPDATE_USER'; payload: AdminUser }
  | { type: 'UPDATE_MATERIAL'; payload: AdminMaterial }
  | { type: 'UPDATE_PAYMENT'; payload: AdminPayment }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'REMOVE_MATERIAL'; payload: string };

// Initial state
const initialState: AdminState = {
  overview: null,
  overviewLoading: false,
  users: [],
  usersLoading: false,
  usersPagination: null,
  selectedUser: null,
  materials: [],
  materialsLoading: false,
  materialsPagination: null,
  selectedMaterial: null,
  payments: [],
  paymentsLoading: false,
  paymentsPagination: null,
  selectedPayment: null,
  logs: [],
  logsLoading: false,
  logsPagination: null,
  userFilters: {},
  materialFilters: {},
  paymentFilters: {},
  logFilters: {}
};

// Reducer
function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_OVERVIEW':
      return { ...state, overview: action.payload };
    case 'SET_OVERVIEW_LOADING':
      return { ...state, overviewLoading: action.payload };
    case 'SET_USERS':
      return { 
        ...state, 
        users: action.payload.users, 
        usersPagination: action.payload.pagination 
      };
    case 'SET_USERS_LOADING':
      return { ...state, usersLoading: action.payload };
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.payload };
    case 'SET_MATERIALS':
      return { 
        ...state, 
        materials: action.payload.materials, 
        materialsPagination: action.payload.pagination 
      };
    case 'SET_MATERIALS_LOADING':
      return { ...state, materialsLoading: action.payload };
    case 'SET_SELECTED_MATERIAL':
      return { ...state, selectedMaterial: action.payload };
    case 'SET_PAYMENTS':
      return { 
        ...state, 
        payments: action.payload.payments, 
        paymentsPagination: action.payload.pagination 
      };
    case 'SET_PAYMENTS_LOADING':
      return { ...state, paymentsLoading: action.payload };
    case 'SET_SELECTED_PAYMENT':
      return { ...state, selectedPayment: action.payload };
    case 'SET_LOGS':
      return { 
        ...state, 
        logs: action.payload.logs, 
        logsPagination: action.payload.pagination 
      };
    case 'SET_LOGS_LOADING':
      return { ...state, logsLoading: action.payload };
    case 'SET_USER_FILTERS':
      return { ...state, userFilters: action.payload };
    case 'SET_MATERIAL_FILTERS':
      return { ...state, materialFilters: action.payload };
    case 'SET_PAYMENT_FILTERS':
      return { ...state, paymentFilters: action.payload };
    case 'SET_LOG_FILTERS':
      return { ...state, logFilters: action.payload };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user._id === action.payload._id ? action.payload : user
        ),
        selectedUser: state.selectedUser?._id === action.payload._id 
          ? action.payload 
          : state.selectedUser
      };
    case 'UPDATE_MATERIAL':
      return {
        ...state,
        materials: state.materials.map(material => 
          material._id === action.payload._id ? action.payload : material
        ),
        selectedMaterial: state.selectedMaterial?._id === action.payload._id 
          ? action.payload 
          : state.selectedMaterial
      };
    case 'UPDATE_PAYMENT':
      return {
        ...state,
        payments: state.payments.map(payment => 
          payment._id === action.payload._id ? action.payload : payment
        ),
        selectedPayment: state.selectedPayment?._id === action.payload._id 
          ? action.payload 
          : state.selectedPayment
      };
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(user => user._id !== action.payload),
        selectedUser: state.selectedUser?._id === action.payload ? null : state.selectedUser
      };
    case 'REMOVE_MATERIAL':
      return {
        ...state,
        materials: state.materials.filter(material => material._id !== action.payload),
        selectedMaterial: state.selectedMaterial?._id === action.payload ? null : state.selectedMaterial
      };
    default:
      return state;
  }
}

// Context interface
interface AdminContextType {
  state: AdminState;
  
  // Overview actions
  loadOverview: () => Promise<void>;
  
  // User actions
  loadUsers: (page?: number, filters?: UserFilters) => Promise<void>;
  loadUserById: (id: string) => Promise<AdminUser | null>;
  updateUserRole: (id: string, data: UpdateUserRoleData) => Promise<void>;
  updateUserStatus: (id: string, data: UpdateUserStatusData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setSelectedUser: (user: AdminUser | null) => void;
  setUserFilters: (filters: UserFilters) => void;
  
  // Material actions
  loadMaterials: (page?: number, filters?: MaterialFilters) => Promise<void>;
  approveMaterial: (id: string, data: ApproveMaterialData) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  setSelectedMaterial: (material: AdminMaterial | null) => void;
  setMaterialFilters: (filters: MaterialFilters) => void;
  
  // Payment actions
  loadPayments: (page?: number, filters?: PaymentFilters) => Promise<void>;
  refundPayment: (id: string, data: RefundPaymentData) => Promise<void>;
  setSelectedPayment: (payment: AdminPayment | null) => void;
  setPaymentFilters: (filters: PaymentFilters) => void;
  
  // Log actions
  loadLogs: (page?: number, filters?: LogFilters) => Promise<void>;
  setLogFilters: (filters: LogFilters) => void;
}

// Create context
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Provider component
interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Overview actions
  const loadOverview = async () => {
    try {
      dispatch({ type: 'SET_OVERVIEW_LOADING', payload: true });
      const response = await adminAPI.getOverview();
      if (response.data.success) {
        dispatch({ type: 'SET_OVERVIEW', payload: response.data.data });
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      toast.error('Failed to load overview data');
    } finally {
      dispatch({ type: 'SET_OVERVIEW_LOADING', payload: false });
    }
  };

  // User actions
  const loadUsers = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_USERS_LOADING', payload: true });
      const params = { page, limit: 20, ...filters };
      const response = await adminAPI.getUsers(params);
      if (response.data.success) {
        dispatch({ 
          type: 'SET_USERS', 
          payload: { 
            users: response.data.data.users, 
            pagination: response.data.data.pagination 
          } 
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      dispatch({ type: 'SET_USERS_LOADING', payload: false });
    }
  };

  const loadUserById = async (id: string): Promise<AdminUser | null> => {
    try {
      const response = await adminAPI.getUserById(id);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Failed to load user details');
      return null;
    }
  };

  const updateUserRole = async (id: string, data: UpdateUserRoleData) => {
    try {
      const response = await adminAPI.updateUserRole(id, data.role);
      if (response.data.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.data });
        toast.success('User role updated successfully');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const updateUserStatus = async (id: string, data: UpdateUserStatusData) => {
    try {
      const response = await adminAPI.updateUserStatus(id, data.status);
      if (response.data.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.data });
        toast.success('User status updated successfully');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await adminAPI.deleteUser(id);
      if (response.data.success) {
        dispatch({ type: 'REMOVE_USER', payload: id });
        toast.success('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const setSelectedUser = (user: AdminUser | null) => {
    dispatch({ type: 'SET_SELECTED_USER', payload: user });
  };

  const setUserFilters = (filters: UserFilters) => {
    dispatch({ type: 'SET_USER_FILTERS', payload: filters });
  };

  // Material actions
  const loadMaterials = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: true });
      const params = { page, limit: 20, ...filters };
      const response = await adminAPI.getMaterials(params);
      if (response.data.success) {
        dispatch({ 
          type: 'SET_MATERIALS', 
          payload: { 
            materials: response.data.data.materials, 
            pagination: response.data.data.pagination 
          } 
        });
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Failed to load materials');
    } finally {
      dispatch({ type: 'SET_MATERIALS_LOADING', payload: false });
    }
  };

  const approveMaterial = async (id: string, data: ApproveMaterialData) => {
    try {
      const response = await adminAPI.approveMaterial(id, data);
      if (response.data.success) {
        dispatch({ type: 'UPDATE_MATERIAL', payload: response.data.data });
        toast.success(`Material ${data.approved ? 'approved' : 'rejected'} successfully`);
      }
    } catch (error) {
      console.error('Error approving material:', error);
      toast.error('Failed to update material status');
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const response = await adminAPI.deleteMaterial(id);
      if (response.data.success) {
        dispatch({ type: 'REMOVE_MATERIAL', payload: id });
        toast.success('Material deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const setSelectedMaterial = (material: AdminMaterial | null) => {
    dispatch({ type: 'SET_SELECTED_MATERIAL', payload: material });
  };

  const setMaterialFilters = (filters: MaterialFilters) => {
    dispatch({ type: 'SET_MATERIAL_FILTERS', payload: filters });
  };

  // Payment actions
  const loadPayments = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_PAYMENTS_LOADING', payload: true });
      const params = { page, limit: 20, ...filters };
      const response = await adminAPI.getPayments(params);
      if (response.data.success) {
        dispatch({ 
          type: 'SET_PAYMENTS', 
          payload: { 
            payments: response.data.data.payments, 
            pagination: response.data.data.pagination 
          } 
        });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      dispatch({ type: 'SET_PAYMENTS_LOADING', payload: false });
    }
  };

  const refundPayment = async (id: string, data: RefundPaymentData) => {
    try {
      const response = await adminAPI.refundPayment(id, data);
      if (response.data.success) {
        dispatch({ type: 'UPDATE_PAYMENT', payload: response.data.data });
        toast.success('Payment refunded successfully');
      }
    } catch (error) {
      console.error('Error refunding payment:', error);
      toast.error('Failed to refund payment');
    }
  };

  const setSelectedPayment = (payment: AdminPayment | null) => {
    dispatch({ type: 'SET_SELECTED_PAYMENT', payload: payment });
  };

  const setPaymentFilters = (filters: PaymentFilters) => {
    dispatch({ type: 'SET_PAYMENT_FILTERS', payload: filters });
  };

  // Log actions
  const loadLogs = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOGS_LOADING', payload: true });
      const params = { page, limit: 50, ...filters };
      const response = await adminAPI.getLogs(params);
      if (response.data.success) {
        dispatch({ 
          type: 'SET_LOGS', 
          payload: { 
            logs: response.data.data.logs, 
            pagination: response.data.data.pagination 
          } 
        });
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      dispatch({ type: 'SET_LOGS_LOADING', payload: false });
    }
  };

  const setLogFilters = (filters: LogFilters) => {
    dispatch({ type: 'SET_LOG_FILTERS', payload: filters });
  };

  const value: AdminContextType = {
    state,
    loadOverview,
    loadUsers,
    loadUserById,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    setSelectedUser,
    setUserFilters,
    loadMaterials,
    approveMaterial,
    deleteMaterial,
    setSelectedMaterial,
    setMaterialFilters,
    loadPayments,
    refundPayment,
    setSelectedPayment,
    setPaymentFilters,
    loadLogs,
    setLogFilters
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook to use admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}; 