import apiService from './api.service';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: any;
    token: string;
  };
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    return apiService.post('/auth/login', data);
  }

  async adminLogin(data: LoginData): Promise<AuthResponse> {
    return apiService.post('/auth/admin/login', data);
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiService.post('/auth/register', data);
  }

  async logout(): Promise<void> {
    return apiService.post('/auth/logout');
  }

  async getMe(): Promise<any> {
    return apiService.get('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<any> {
    return apiService.put('/auth/password', {
      currentPassword,
      newPassword,
    });
  }
}

export default new AuthService();
