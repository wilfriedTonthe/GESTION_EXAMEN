import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Divider,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import examService from '../../../services/examService';
import StudentFaceVerification from '../../../components/StudentFaceVerification';

const ExamUnifiedAccessPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: accès, 2: vérification faciale
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [examId, setExamId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleAccessSubmit = async () => {
    if (!password.trim() || !studentName.trim()) {
      setError("Veuillez entrer le mot de passe et votre nom complet.");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await examService.getExamByPasswordAndStudent(password.trim(), studentName.trim());
      console.log('Données reçues après vérification:', data);
      
      // Utiliser exam_id si disponible, sinon essayer avec id
      const examIdValue = data?.exam_id || data?.id;
      
      if (examIdValue) {
        setExamId(examIdValue);
        setExamTitle(data.title || 'Examen');
        setStep(2);
        toast({
          title: "Accès autorisé",
          description: "Procédez à la vérification faciale.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Examen introuvable.");
      }
    } catch (err) {
      console.error(err);
      setError("Accès refusé. Vérifiez vos informations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = (success) => {
    if (success) {
      toast({
        title: "Vérification réussie",
        description: "Redirection vers l'examen...",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      // Stocker le nom de l'étudiant dans le localStorage pour la récupération ultérieure
      localStorage.setItem('studentName', studentName.trim());
      console.log('Nom de l\'étudiant stocké dans localStorage:', studentName.trim());
      
      // Le token a déjà été stocké dans handleAccessSubmit
      // Rediriger vers la page d'examen avec l'ID et le mot de passe
      navigate(`/exam/${examId}?password=${password}`);
    } else {
      setError("Vérification faciale échouée. Veuillez réessayer.");
    }
  };

  return (
    <Container maxW="md" py={10}>
      <Box p={8} bg={cardBg} borderRadius="md" boxShadow="md" borderColor={borderColor} borderWidth="1px">
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg">
              {step === 1 ? "Accès à l'examen" : "Vérification faciale"}
            </Heading>
            <Text mt={2} color="gray.500">
              {step === 1
                ? "Veuillez entrer le mot de passe de l'examen et votre nom complet."
                : "Veuillez vous positionner face à la caméra."}
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {step === 1 ? (
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Mot de passe de l'examen</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nom complet</FormLabel>
                <Input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </FormControl>

              <Button
                onClick={handleAccessSubmit}
                colorScheme="blue"
                width="100%"
                isLoading={isLoading}
              >
                Accéder à l'examen
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4}>
              <Divider />
              <Text fontWeight="semibold">Examen : {examTitle}</Text>
              <StudentFaceVerification
                examId={examId}
                studentName={studentName}
                sessionId={String(Date.now())}
                onVerificationComplete={handleVerificationComplete}
              />
            </VStack>
          )}
        </VStack>
      </Box>
    </Container>
  );
};

export default ExamUnifiedAccessPage;
