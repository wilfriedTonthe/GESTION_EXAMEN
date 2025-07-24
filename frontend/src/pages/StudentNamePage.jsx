import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import examService from '../services/examService';
import StudentFaceVerification from '../components/StudentFaceVerification';

const StudentNamePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState('name'); // 'name' ou 'faceVerification'
  const [studentName, setStudentName] = useState('');
  const [examId, setExamId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    // Récupérer l'ID de l'examen depuis l'URL ou localStorage
    const examIdFromUrl = searchParams.get('exam_id');
    const examIdFromStorage = localStorage.getItem('currentExamId');
    const examId = examIdFromUrl || examIdFromStorage;
    
    if (!examId) {
      // Rediriger vers la page de saisie du mot de passe si aucun ID d'examen n'est trouvé
      navigate('/exam/login');
      return;
    }
    
    setExamId(examId);
    setExamTitle(localStorage.getItem('examTitle') || 'Examen');
    
    // Si le nom de l'étudiant est déjà dans le localStorage, le pré-remplir
    const savedName = localStorage.getItem('studentName');
    if (savedName) {
      setStudentName(savedName);
    }
  }, [navigate, searchParams]);

  const handleNameSubmit = async () => {
    if (!studentName.trim()) {
      setError("Veuillez entrer votre nom complet.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Vérification du nom:', studentName.trim(), 'pour l\'examen:', examId);
      await examService.verifyStudent(examId, studentName.trim());
      
      // Sauvegarder le nom dans localStorage
      localStorage.setItem('studentName', studentName.trim());
      
      // Passer à l'étape de vérification faciale
      setStep('faceVerification');
      
      toast({
        title: "Nom vérifié",
        description: "Veuillez maintenant procéder à la vérification faciale.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Erreur lors de la vérification du nom:', err);
      setError(err.response?.data?.detail || err.message || "La vérification du nom a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = (success) => {
    if (success) {
      toast({
        title: "Vérification faciale réussie!",
        description: "Vous allez être redirigé vers l'examen.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(`/exam/${examId}`);
    } else {
      setError("La vérification faciale a échoué. Veuillez réessayer.");
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        bg={cardBg}
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="lg" mb={2}>
              {examTitle}
            </Heading>
            <Text color="gray.500">
              {step === 'name' ? 'Veuillez entrer votre nom complet pour continuer.' : 'Vérification faciale en cours...'}
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {step === 'name' ? (
            <VStack spacing={5}>
              <FormControl id="studentName" isRequired>
                <FormLabel>Votre nom complet</FormLabel>
                <Input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Entrez votre nom complet"
                  autoComplete="name"
                />
              </FormControl>
              <Button
                onClick={handleNameSubmit}
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
                loadingText="Vérification..."
              >
                Vérifier mon identité
              </Button>
            </VStack>
          ) : (
            <StudentFaceVerification 
              examId={examId}
              studentName={studentName}
              sessionId={String(Date.now())}
              onVerificationComplete={handleVerificationComplete}
            />
          )}
        </VStack>
      </Box>
    </Container>
  );
};

export default StudentNamePage;
