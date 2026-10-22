const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/Intro.vue'),
        meta: {
          seo: {
            title: 'Home',
            description: 'Learn about Auto Repair Log and begin your personality journey.',
            canonicalPath: '/',
          },
        },
      },
      {
        path: 'docs',
        component: () => import('@/pages/Docs.vue'),
        meta: {
          seo: {
            title: 'Docs',
            description: 'Discover the story and idea behind Auto Repair Log.',
            canonicalPath: '/docs',
          },
        },
      },
      {
        path: 'auto',
        component: () => import('@/pages/Auto.vue'),
        meta: {
          seo: {
            title: 'Auto',
            description: 'Create and manage your auto records.',
            canonicalPath: '/auto',
          },
        },
      },
      {
        path: 'profile',
        component: () => import('@/pages/Profile.vue'),
        meta: {
          seo: {
            title: 'Profile',
            description: 'View and edit your Auto Repair Log profile.',
            canonicalPath: '/profile',
          },
        },
      },
      {
        path: 'login',
        component: () => import('@/pages/Login.vue'),
        meta: {
          seo: {
            title: 'Login',
            description: 'Sign in to continue your Auto Repair Log experience.',
            canonicalPath: '/login',
          },
        },
      },
      {
        path: 'barcode-scanner',
        component: () => import('@/pages/BarcodeScanner.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Barcode Scanner',
            description: 'Scan barcodes using your device camera.',
            canonicalPath: '/barcode-scanner',
          },
        },
      },
      {
        path: 'create-login',
        component: () => import('@/pages/CreateLogin.vue'),
        meta: {
          seo: {
            title: 'Create account',
            description: 'Create an account to save your personality results.',
            canonicalPath: '/create-login',
          },
        },
      },
      {
        path: 'forgot-password',
        component: () => import('@/pages/ForgotPassword.vue'),
        meta: {
          seo: {
            title: 'Forgot password',
            description: 'Reset your password to access your Auto Repair Log account.',
            canonicalPath: '/forgot-password',
          },
        },
      },
      {
        path: 'reset-password',
        component: () => import('@/pages/ResetPassword.vue'),
        meta: {
          seo: {
            title: 'Reset password',
            description: 'Choose a new password for your Auto Repair Log account.',
            canonicalPath: '/reset-password',
          },
        },
      },
      {
        path: 'change-password',
        component: () => import('@/pages/ChangePassword.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Change password',
            description: 'Change the password for your Auto Repair Log account.',
            canonicalPath: '/change-password',
          },
        },
      },
      {
        path: 'profile',
        component: () => import('@/pages/Profile.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Profile',
            description: 'Create and manage your Auto Repair Log profile.',
            canonicalPath: '/profile',
          },
        },
      },
      {
        path: 'auto',
        component: () => import('@/pages/Auto.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Auto',
            description: 'Create and manage your auto records.',
            canonicalPath: '/auto',
          },
        },
      },
      {
        path: 'mileage',
        component: () => import('@/pages/Mileage.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Mileage',
            description: 'Create and manage your auto mileage records.',
            canonicalPath: '/mileage',
          },
        },
      },
      {
        path: 'schedule',
        component: () => import('@/pages/Schedule.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Schedule',
            description: 'Create and manage your schedules.',
            canonicalPath: '/schedule',
          },
        },
      },
      {
        path: 'service',
        component: () => import('@/pages/Service.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Service',
            description: 'Create and manage your services.',
            canonicalPath: '/service',
          },
        },
      },
      {
        path: 'service-order',
        component: () => import('@/pages/ServiceOrder.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Service Order',
            description: 'Create and manage your service orders.',
            canonicalPath: '/service-order',
          },
        },
      },
      {
        path: 'service-log',
        component: () => import('@/pages/ServiceLog.vue'),
        meta: {
          requiresAuth: true,
          seo: {
            title: 'Service Log',
            description: 'Create and manage your service logs.',
            canonicalPath: '/service-log',
          },
        },
      },
      {
        path: 'users',
        component: () => import('@/pages/Users.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          seo: {
            title: 'Users',
            description: 'View the users and community members in Auto Repair Log.',
            canonicalPath: '/users',
          },
        },
      },
      {
        path: 'feedback',
        component: () => import('@/pages/Feedback.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          seo: {
            title: 'Feedback',
            description: 'View feedback submitted by Auto Repair Log users.',
            canonicalPath: '/feedback',
          },
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: {
      seo: {
        title: 'Page not found',
        description: 'The page you requested could not be found.',
        canonicalPath: '/404',
        robots: 'noindex,follow',
      },
    },
  },
]

export default routes
