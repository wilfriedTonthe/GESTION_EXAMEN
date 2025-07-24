import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ROUTES } from "../../../constants/routes";

const TeacherLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast({
    position: 'top',
    duration: 3000,
    isClosable: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    
    setIsLoading(true);
    
    try {
      const from = location.state?.from?.pathname ?? ROUTES.DASHBOARD;
    await login(formData.email, formData.password, navigate, from);
      
      if (!isMounted.current) return;
      
      // Afficher le message de succès
      toast({
        title: 'Connexion réussie',
        description: 'Vous êtes maintenant connecté',
        status: 'success',
        duration: 1000, // Réduire la durée pour une redirection plus rapide
        isClosable: true,
      });
      
    } catch (error) {
      if (!isMounted.current) return;
      
      console.error('Erreur de connexion:', error);
      
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        status: 'error',
      });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box p={8} maxW="md" w="full" borderWidth={1} borderRadius="lg">
        <Heading mb={6} textAlign="center">Connexion Enseignant</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Mot de passe</FormLabel>
              <Input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </FormControl>
            <Button 
              type="submit" 
              colorScheme="blue" 
              w="full" 
              mt={4}
              isLoading={isLoading}
              loadingText="Connexion en cours..."
            >
              Se connecter
            </Button>
            <Box>
              Pas encore de compte ?{' '}
              <Link to="/teacher/register" style={{ color: 'blue' }}>
                S'inscrire
              </Link>
            </Box>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default TeacherLoginPage;