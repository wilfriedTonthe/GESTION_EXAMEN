import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useToast,
  Divider
} from '@chakra-ui/react';
import examService from '../services/examService';
import StudentFaceVerification from '../components/StudentFaceVerification';

const ExamAccessPage = () => {
  // Variables d'état simplifiées
  const navigate = useNavigate();
  const toast = useToast();
  
  // Étape actuelle: 1 = mot de passe, 2 = nom, 3 = vérification faciale
  const [step, setStep] = useState(1);
  
  // Formulaires
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  
  // Données de l'examen
  const [examId, setExamId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  
  // États pour le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Styles
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Soumission du mot de passe - Version simplifiée
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError("Veuillez entrer le mot de passe de l'examen.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Appel API
      const data = await examService.verifyPassword(password.trim());
      console.log('Réponse API:', data);
      
      // Débogage
      alert('Réponse API: ' + JSON.stringify(data));
      
      if (data && data.exam_id) {
        // Stocker les données
        setExamId(data.exam_id);
        setExamTitle(data.title || 'Examen');
        
        // Passer à l'étape suivante
        setStep(2);
        
        toast({
          title: "Mot de passe validé",
          description: "Veuillez maintenant entrer votre nom complet.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("La réponse du serveur ne contient pas d'ID d'examen.");
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.detail || err.message || "Mot de passe invalide.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Soumission du nom - Version simplifiée
  const handleNameSubmit = async () => {
    if (!studentName.trim()) {
      setError("Veuillez entrer votre nom complet.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Appel API
      await examService.verifyStudent(examId, studentName.trim());
      
      // Passer à l'étape suivante
      setStep(3);
      
      toast({
        title: "Nom vérifié",
        description: "Veuillez maintenant procéder à la vérification faciale.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "La vérification du nom a échoué.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Gestion de la vérification faciale - Version simplifiée
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

  // Rendu du contenu en fonction de l'étape
  const renderContent = () => {
    // Étape 1: Mot de passe
    if (step === 1) {
      return (
        <VStack spacing={5}>
          <FormControl id="password" isRequired>
            <FormLabel>Mot de passe de l'examen</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              autoComplete="current-password"
            />
          </FormControl>
          <Button
            onClick={handlePasswordSubmit}
            colorScheme="blue"
            width="100%"
            isLoading={isLoading}
            loadingText="Vérification..."
          >
            Suivant
          </Button>
        </VStack>
      );
    }
    
    // Étape 2: Nom de l'étudiant
    if (step === 2) {
      return (
        <VStack spacing={5}>
          <Divider my={2} />
          <Text fontWeight="bold">
            Examen: {examTitle}
          </Text>
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
      );
    }
    
    // Étape 3: Vérification faciale
    if (step === 3) {
      return (
        <VStack spacing={5}>
          <Divider my={2} />
          <Text>Vérification faciale en cours...</Text>
          <StudentFaceVerification 
            examId={examId}
            studentName={studentName}
            sessionId={String(Date.now())}
            onVerificationComplete={handleVerificationComplete}
          />
        </VStack>
      );
    }
    
    // Par défaut
    return <Text>Chargement...</Text>;
  };

  // Titre et instructions en fonction de l'étape
  const getStepTitle = () => {
    if (step === 1) return "Accéder à l'examen";
    if (step === 2) return "Vérification d'identité";
    return "Vérification faciale";
  };
  
  const getStepInstructions = () => {
    if (step === 1) return "Entrez le mot de passe pour continuer.";
    if (step === 2) return "Veuillez entrer votre nom complet.";
    return "Veuillez vous positionner face à la caméra.";
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
              {getStepTitle()}
            </Heading>
            <Text color="gray.500">
              {getStepInstructions()}
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {renderContent()}
          
          {/* Indicateur d'étape */}
          <Box pt={4} textAlign="center">
            <Text fontSize="sm" color="gray.500">
              Étape {step}/3
            </Text>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default ExamAccessPage;
