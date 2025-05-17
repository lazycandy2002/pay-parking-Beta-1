import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FullScreenLayout from '@/layouts/FullScreenLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/',
      component: FullScreenLayout,
      children: [
        {
          path: '/login',
          name: 'login',
          component: () => import('../views/LoginView.vue'),
        },
      ]
    },
    {
      path: '/',
      component: DashboardLayout,
      children: [
        {
          path: '/home',
          name: 'home',
          component: HomeView,
        },
        {
          path: '/new-registration',
          name: 'new-registration',
          component: () => import('../views/NewRegistrationView.vue'),
        },
        {
          path: '/transactions',
          name: 'transactions',
          component: () => import('../views/TransactionsView.vue'),
        },
        {
          path: '/parking-records',
          name: 'parking-records',
          component: () => import('../views/ParkingRecordsView.vue'),
        },
        {
          path: '/parking-slots',
          name: 'parking-slots',
          component: () => import('../views/ParkingSlotsView.vue'),
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
      ]
    },
  ],
})

export default router