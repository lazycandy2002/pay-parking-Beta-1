<template>
  <div class="login-container">
    <div class="login-card">
      <div class="avatar-container">
        <img src="../assets/J&W Logo.png" alt="J&W Logo" class="logo-image" />
      </div>
      
      <h1 class="title">Admin Portal Login</h1>
      
      <Form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top">
        <FormItem prop="username">
          <Input 
            v-model="loginForm.username" 
            prefix="ios-person"
            placeholder="Username" 
            size="large"
            autocomplete="username"
          />
        </FormItem>

        <FormItem prop="password">
          <Input
            v-model="loginForm.password"
            type="password"
            prefix="ios-lock"
            placeholder="Password"
            size="large"
            autocomplete="current-password"
            @on-enter="handleLogin"
          />
        </FormItem>

        <FormItem>
          <Button 
            type="primary" 
            long 
            size="large" 
            @click="handleLogin" 
            :loading="isLoading"
            class="login-button"
          >
            Login
          </Button>
        </FormItem>
        
      </Form>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div class="login-footer">
        <p>© {{ currentYear }} J & W Pay Parking</p>
      </div>
    </div>
    
    <div class="profile-icon" @click="navigateToProfile">
      <Icon type="ios-person" size="24" />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';

export default defineComponent({
  name: 'LoginView',
  
  setup() {
    const router = useRouter();
    const loginFormRef = ref(null);
    const isLoading = ref(false);
    const errorMessage = ref('');
    
    const loginForm = reactive({
      username: '',
      password: ''
    });
    
    const loginRules = {
      username: [
        { required: true, message: 'Username is required', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Password is required', trigger: 'blur' }
      ]
    };
    
    const currentYear = computed(() => new Date().getFullYear());
    
    async function handleLogin() {
      errorMessage.value = '';
      
      if (loginFormRef.value) {
        loginFormRef.value.validate(async (valid) => {
          if (valid) {
            isLoading.value = true;
            
            try {
              // Query the users table for the entered username
              const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', loginForm.username)
                .single();
              
              if (error) {
                throw error;
              }
              
              if (!users) {
                errorMessage.value = 'Invalid username or password';
                return;
              }
              
              // Check if the password matches
              if (users.password === loginForm.password) {
                // Login successful
                const userData = {
                  userid: users.userid,
                  username: users.username,
                  role: users.role,
                  created_at: users.created_at
                };
                
                // Store user data in sessionStorage
                sessionStorage.setItem('userData', JSON.stringify(userData));
                sessionStorage.setItem('userRole', users.role);
                sessionStorage.setItem('adminToken', 'logged-in-' + Date.now()); // Generate a simple token
                
                router.push('/home');
              } else {
                errorMessage.value = 'Invalid username or password';
              }
            } catch (error) {
              console.error('Login error:', error);
              errorMessage.value = 'Authentication failed. Please try again later.';
            } finally {
              isLoading.value = false;
            }
          }
        });
      }
    }
    
    function forgotPassword() {
      router.push('/reset-password');
    }
    
    function navigateToProfile() {
      router.push('/add-profile');
    }
    
    return {
      loginFormRef,
      loginForm,
      loginRules,
      isLoading,
      errorMessage,
      currentYear,
      handleLogin,
      forgotPassword,
      navigateToProfile
    };
  }
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%);
  position: relative;
}

.login-card {
  width: 400px;
  background-color: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.logo-image {
  width: 100px;
  height: 100px;
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: 500;
  color: #17233d;
  margin-bottom: 25px;
}

.login-button {
  height: 45px;
  font-size: 16px;
  margin-top: 10px;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  color: #808695;
  font-size: 12px;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #f44336;
  font-size: 14px;
  text-align: center;
}

.forgot-password {
  text-align: center;
  margin-top: 10px;
  font-size: 14px;
}

.forgot-password a {
  color: #2d8cf0;
  cursor: pointer;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.profile-icon {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.3s ease;
}

.profile-icon:hover {
  transform: scale(1.1);
  background-color: #f8f8f8;
}

@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 20px;
  }
}
</style>