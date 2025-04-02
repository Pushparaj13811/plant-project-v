import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

interface TokenResponse {
  access: string;
}

interface ApiError {
  detail?: string;
  email?: string[];
  name?: string[];
  password?: string[];
  [key: string]: unknown;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const refreshAccessToken = createAsyncThunk<
  TokenResponse,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const { refreshToken } = getState().auth;
    if (!refreshToken) {
      return rejectWithValue('No refresh token available');
    }

    try {
      const formData = new URLSearchParams();
      formData.append('refresh', refreshToken);

      const response = await axios.post<TokenResponse>(
        'http://localhost:8000/api/auth/token/refresh/',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.detail || 'Failed to refresh token');
      }
      return rejectWithValue('Failed to refresh token');
    }
  }
);

export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email); // FastAPI expects 'username' field
      formData.append('password', credentials.password);

      const response = await axios.post<AuthResponse>(
        'http://localhost:8000/api/auth/login/',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          return rejectWithValue(error.response.data.error || 'Invalid credentials');
        }
        
        // Handle validation errors
        if (error.response?.data) {
          const data = error.response.data as ApiError;
          if (data.detail) {
            return rejectWithValue(data.detail);
          }
          // Handle field-specific errors
          const errors: string[] = [];
          if (data.email) errors.push(`Email: ${data.email[0]}`);
          if (data.password) errors.push(`Password: ${data.password[0]}`);
          return rejectWithValue(errors.join(', '));
        }

        // Handle network errors
        if (!error.response) {
          return rejectWithValue('Network error. Please check your connection.');
        }
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post<AuthResponse>('http://localhost:8000/api/auth/register/', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as ApiError;
        if (data.detail) {
          return rejectWithValue(data.detail);
        }
        const errors = [];
        if (data.email) errors.push(data.email[0]);
        if (data.name) errors.push(data.name[0]);
        if (data.password) errors.push(data.password[0]);
        return rejectWithValue(errors.join(', ') || 'Registration failed');
      }
      return rejectWithValue('Registration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Refresh token cases
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.access;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setError, updateUser } = authSlice.actions;
export { authSlice };
export default authSlice.reducer; 