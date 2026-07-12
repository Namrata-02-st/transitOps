import api from './api';

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.data && response.data.success) {
    const { token, user } = response.data.data;
    localStorage.setItem('transitops_token', token);
    localStorage.setItem('transitops_user', JSON.stringify(user));
    return user;
  }
  
  throw new Error('Authentication response malformed');
};

export const logoutUser = () => {
  localStorage.removeItem('transitops_token');
  localStorage.removeItem('transitops_user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('transitops_user');
  return user ? JSON.parse(user) : null;
};
