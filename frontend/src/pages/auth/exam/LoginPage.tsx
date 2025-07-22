import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { authService } from '../../../services/authService';

interface LoginFormData {
  email: string;
  password: string;
  examCode: string;
}

const ExamLoginPage = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    examCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Authentification
      await authService.login(formData.email, formData.password);
      
      // Redirection vers la page de l'examen si le code est fourni
      if (formData.examCode) {
        navigate(`/exam/${formData.examCode}`);
      } else {
        navigate('/dashboard');
      }
      
      toast({
        title: 'Connexion réussie',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast({
        title: 'Erreur de connexion',
        description: 'Email ou mot de passe incorrect',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box p={8} maxW="md" w="full" bg="white" borderRadius="lg" boxShadow="md">
        <Heading mb={6} textAlign="center" color="blue.600">Connexion à l'application</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
              />
            </FormControl>

            <FormControl id="password" isRequired>
              <FormLabel>Mot de passe</FormLabel>
              <InputGroup>
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl id="examCode">
              <FormLabel>Code d'accès à l'examen (optionnel)</FormLabel>
              <Input 
                type="text" 
                name="examCode"
                value={formData.examCode}
                onChange={handleChange}
                placeholder="Code fourni par votre enseignant"
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
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default ExamLoginPage;