import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast, Text } from '@chakra-ui/react';
import examService from '../../../services/examService';
import { ROUTES } from '../../../constants/routes';

const ExamLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const from = location.state?.from?.pathname ?? ROUTES.EXAM_ACCESS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await examService.verifyPassword(password);
      
      if (!isMounted.current) return;

      toast({
        title: 'Accès autorisé',
        description: "Vous allez être redirigé vers l'examen.",
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(from, { replace: true });

    } catch (error: any) { 
      if (!isMounted.current) return;

      toast({
        title: 'Erreur',
        description: error.response?.data?.detail ?? 'Mot de passe invalide ou erreur serveur.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box p={8} maxWidth="500px" mx="auto">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Heading>Accéder à l'examen</Heading>
        <Text>Veuillez entrer le mot de passe de l'examen pour continuer.</Text>
        <FormControl isRequired>
          <FormLabel>Mot de passe de l'examen</FormLabel>
          <Input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <Button type="submit" colorScheme="teal" width="full" isLoading={isLoading}>
          Entrer
        </Button>
      </VStack>
    </Box>
  );
};

export default ExamLoginPage;