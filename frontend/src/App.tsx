import { Box, ChakraProvider, ColorModeScript, useColorMode } from '@chakra-ui/react';
//import Header from './components/Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useEffect, ComponentType } from 'react';

import theme from './theme';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ExamResultsPage from './pages/ExamResultsPage';
import ExamAccessPage from './pages/ExamAccessPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import LoginPage from './pages/auth/teacher/LoginPage';
import TeacherRegisterPage from './pages/auth/teacher/RegisterPage';

import { AuthProvider } from './contexts/AuthContext';

import { ROUTES } from './constants/routes';
import { ProtectedRoute } from './components/ProtectedRoute';

// Configuration de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Types
interface ForceLightModeProps {
  children: ReactNode;
}

interface LayoutProps {
  children: ReactNode;
}

interface PageWithLayoutProps {
  component: ComponentType;
  [key: string]: any;
}

// Composant pour forcer le mode clair
const ForceLightMode: React.FC<ForceLightModeProps> = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  
  // S'assurer que le mode clair est activé
  useEffect(() => {
    if (colorMode === 'dark') {
      toggleColorMode();
    }
  }, [colorMode, toggleColorMode]);
  
  return <>{children}</>;
};

// Layout de base de l'application
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" minH="100vh">
     
      <Box as="main" flexGrow={1}>
        {children}
      </Box>
      
    </Box>
  );
};

// Composant pour les pages avec layout
const PageWithLayout: React.FC<PageWithLayoutProps> = ({ component: Component, ...rest }) => {
  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
};

// Composant principal de l'application
function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <ForceLightMode>
              <Box as="main" minH="100vh">
                <Routes>
                  {/* Routes publiques */}
                  <Route path={ROUTES.HOME} element={<PageWithLayout component={HomePage} />} />
                  
                  <Route path={ROUTES.EXAM_ACCESS} element={
                    <PageWithLayout component={ExamAccessPage} />
                  } />
                  
                  {/* Routes d'authentification */}
                  <Route path={ROUTES.TEACHER_LOGIN} element={
                    <PageWithLayout component={LoginPage} />
                  } />
                  
                  <Route path={ROUTES.TEACHER_REGISTER} element={
                    <PageWithLayout component={TeacherRegisterPage} />
                  } />
                  
                  {/* Route de l'examen - accessible sans authentification */}
                  <Route 
                    path={ROUTES.EXAM} 
                    element={
                      <ProtectedRoute publicRoute={true}>
                        <ExamPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Ancienne route pour compatibilité */}
                  <Route 
                    path="/exam/start/:password" 
                    element={
                      <ProtectedRoute publicRoute={true}>
                        <ExamPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path={ROUTES.EXAM_RESULTS} element={
                    <ProtectedRoute publicRoute={true}>
                      <PageWithLayout component={ExamResultsPage} />
                    </ProtectedRoute>
                  } />
                  
                  <Route path={ROUTES.TEACHER} element={
                    <ProtectedRoute requireTeacher>
                      <PageWithLayout component={TeacherDashboardPage} />
                    </ProtectedRoute>
                  } />
                  
                  <Route path={ROUTES.DASHBOARD} element={
                    <ProtectedRoute>
                      <PageWithLayout component={TeacherDashboardPage} />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                </Routes>
              </Box>
              <Footer />
              
              {/* Outils de développement */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                  initialIsOpen={false}
                  position="bottom"
                  buttonPosition="bottom-left"
                />
              )}
            </ForceLightMode>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;