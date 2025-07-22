import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  FormControl, 
  FormLabel, 
  Input, 
  Alert,
  AlertIcon,
  Link as ChakraLink,
  useColorModeValue
} from '@chakra-ui/react';
import { FaArrowRight, FaLock } from 'react-icons/fa';
import { ROUTES } from '../constants/routes';
import examService from '../services/examService';

const ExamAccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState(location.state?.examPassword || '');
  const [name, setName] = useState('');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  


  const handleStartExam = async () => {
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedPassword || !trimmedName) {
      alert("Veuillez entrer votre nom complet et le mot de passe de l'examen.");
      return;
    }

    try {
      await examService.verifyPassword(trimmedPassword);
      localStorage.setItem('examStudentName', trimmedName);
      window.location.href = `/exam/${trimmedPassword}`;
    } catch (err) {
      console.error("Erreur lors de la vérification du mot de passe:", err);
      const errorMessage = err.response?.data?.detail || "Mot de passe invalide ou examen non trouvé.";
      alert(`Erreur: ${errorMessage}`);
    }
  };



  useEffect(() => {
    // Vérifier si nous avons un mot de passe dans l'état de localisation
    if (location.state?.examPassword) {
      setPassword(location.state.examPassword);
    }
  }, [location.state]);

  return (
    <Container maxW="md" py={12}>
      <Box
        bg={cardBg}
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={borderColor}
        data-testid="exam-access-form"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Box
              display="inline-flex"
              p={3}
              bg="blue.50"
              color="blue.500"
              borderRadius="full"
              mb={4}
            >
              <FaLock size={24} />
            </Box>
            <Heading as="h1" size="lg" mb={2}>
              Accéder à l'examen
            </Heading>
            <Text color="gray.500">
              Entrez le mot de passe fourni par votre enseignant pour commencer l'examen
            </Text>
          </Box>



          <VStack spacing={5}>
            <FormControl id="name" isRequired>
              <FormLabel>Votre nom complet</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Entrez votre nom complet"
                autoComplete="name"
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Mot de passe de l'examen</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe de l'examen"
                autoComplete="current-password"
              />
            </FormControl>

            <Button
              type="button"
              onClick={handleStartExam}
              colorScheme="blue"
              size="lg"
              rightIcon={<FaArrowRight />}
              width="100%"
            >
              Commencer l'examen
            </Button>
          </VStack>

          <Box textAlign="center" mt={4}>
            <Text color="gray.500" fontSize="sm">
              Vous êtes un enseignant ?{' '}
              <ChakraLink
                as={RouterLink}
                to={ROUTES.TEACHER}
                color="blue.500"
                fontWeight="medium"
                _hover={{ textDecoration: 'underline' }}
              >
                Créer un examen
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default ExamAccessPage;
