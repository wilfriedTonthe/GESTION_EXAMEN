import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  useColorModeValue,
  Divider,
  Icon,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Tooltip,
  IconButton,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image, // Importer le composant Image
  Flex, // Importer Flex pour la mise en page
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaHome, FaFilePdf, FaClipboardList, FaUserCheck } from 'react-icons/fa';
import { ROUTES } from '../constants/routes';
import { submissionService, examService } from '../services/api';

const ResultCard = ({ submission, exam }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const percentage = (submission.score / submission.max_score) * 100;
  
  const getScoreColor = (percent) => {
    if (percent >= 80) return 'green';
    if (percent >= 50) return 'yellow';
    return 'red';
  };

  return (
    <Box
      p={6}
      bg={bg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="md"
      w="100%"
    >
      <VStack spacing={4} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Résultats de l'examen
          </Heading>
          <Text color="gray.500">{exam?.title || 'Examen'}</Text>
        </Box>

        <Divider my={4} />

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
          <Stat textAlign="center" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <StatLabel>Note</StatLabel>
            <StatNumber fontSize="2xl" color={getScoreColor(percentage)}>
              {submission.score} / {submission.max_score}
            </StatNumber>
            <StatHelpText>
              <StatArrow type={percentage >= 50 ? 'increase' : 'decrease'} />
              {percentage.toFixed(1)}%
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <StatLabel>Réponses correctes</StatLabel>
            <StatNumber fontSize="2xl">
              {submission.correct_answers} / {submission.total_questions}
            </StatNumber>
            <StatHelpText>
              {((submission.correct_answers / submission.total_questions) * 100).toFixed(1)}% de réussite
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <StatLabel>Date de soumission</StatLabel>
            <StatNumber fontSize="xl">
              {new Date(submission.submitted_at).toLocaleDateString()}
            </StatNumber>
            <StatHelpText>
              {new Date(submission.submitted_at).toLocaleTimeString()}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box>
          <Text fontWeight="semibold" mb={2}>
            Détail des réponses:
          </Text>
          <Box maxH="400px" overflowY="auto" borderWidth="1px" borderRadius="md" p={2}>
            {submission.answers.map((answer, index) => (
              <Box 
                key={index} 
                p={3} 
                mb={2} 
                bg={answer.is_correct ? 'green.50' : 'red.50'}
                borderLeftWidth="4px"
                borderLeftColor={answer.is_correct ? 'green.500' : 'red.500'}
                borderRadius="md"
              >
                <HStack spacing={2} mb={1}>
                  <Text fontWeight="medium">Question {index + 1}:</Text>
                  {answer.is_correct ? (
                    <Icon as={FaCheckCircle} color="green.500" />
                  ) : (
                    <Icon as={FaTimesCircle} color="red.500" />
                  )}
                  <Text fontSize="sm" color="gray.500">
                    ({answer.points_earned} / {answer.max_points} points)
                  </Text>
                </HStack>
                <Text mb={1} fontWeight="medium">{answer.question_text}</Text>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Votre réponse:</Text> {answer.answer_text || 'Aucune réponse'}
                </Text>
                {!answer.is_correct && answer.correct_answer && (
                  <Text fontSize="sm" color="green.600" fontWeight="medium">
                    Réponse correcte: {answer.correct_answer}
                  </Text>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        <HStack mt={6} justify="center" spacing={4}>
          <Button 
            as={RouterLink} 
            to={ROUTES.HOME} 
            leftIcon={<FaHome />}
            variant="outline"
          >
            Retour à l'accueil
          </Button>
          
          {submission.exam_id && (
            <Button 
              as={RouterLink} 
              to={ROUTES.TEACHER} 
              leftIcon={<FaClipboardList />}
              colorScheme="blue"
              variant="outline"
            >
              Voir tous les résultats
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

const ExamResultsPage = () => {
  const { examId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isMounted = useRef(true);
  
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isDownloadingSignatures, setIsDownloadingSignatures] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure(); // Pour le modal de détails
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Charger les données de soumission et d'examen
  useEffect(() => {
    isMounted.current = true;
    
    const loadData = async () => {
      if (!isMounted.current) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Vérifier d'abord si nous avons des données dans le stockage local (solution de secours)
        try {
          const savedSubmission = localStorage.getItem('lastExamSubmission');
          if (savedSubmission) {
            const { examId, submission, ...rest } = JSON.parse(savedSubmission);
            console.log('Données de soumission récupérées depuis le stockage local:', submission);
            
            if (isMounted.current) {
              setSubmission(submission);
              
              // Charger les détails de l'examen
              if (submission.exam_id) {
                try {
                  const examData = await examService.getExam(submission.exam_id);
                  if (isMounted.current) {
                    setExam(examData);
                    setIsTeacherView(false);
                  }
                } catch (examErr) {
                  console.error('Erreur lors du chargement de l\'examen:', examErr);
                }
              }
              
              // Nettoyer le stockage local après utilisation
              localStorage.removeItem('lastExamSubmission');
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Erreur lors de la récupération des données sauvegardées:', e);
        }
        
        // Vérifier si des données de soumission ont été transmises via l'état de navigation
        if (location.state?.submission) {
          console.log('Données de soumission reçues via location.state:', location.state);
          
          // Utiliser directement les données de soumission fournies
          const submissionData = location.state.submission;
          setSubmission(submissionData);
          
          // Charger les détails de l'examen
          if (submissionData.exam_id) {
            try {
              const examData = await examService.getExam(submissionData.exam_id);
              if (isMounted.current) {
                setExam(examData);
                setIsTeacherView(false);
              }
            } catch (examErr) {
              console.error('Erreur lors du chargement de l\'examen:', examErr);
              // Continuer même si le chargement de l'examen échoue
            }
          }
          
          setLoading(false);
          return;
        }
        
        // Vérifier si c'est une vue enseignant (avec examId) ou étudiant (avec submissionId)
        if (examId) {
          // Charger l'examen d'abord
          try {
            const examData = await examService.getExam(examId);
            if (isMounted.current) {
              setExam(examData);
              setIsTeacherView(true);
              
              // Charger toutes les soumissions pour cet examen
              try {
                const submissions = await submissionService.getExamSubmissions(examId);
                if (isMounted.current) {
                  setAllSubmissions(submissions);
                }
              } catch (submissionErr) {
                console.error('Erreur lors du chargement des soumissions:', submissionErr);
                if (isMounted.current) {
                  setError(prev => prev + ' Impossible de charger les soumissions.');
                }
              }
            }
            
            // Si un ID de soumission est fourni dans l'état de localisation, charger cette soumission
            if (location.state?.submissionId) {
              await loadSubmission(location.state.submissionId, location.state);
            }
          } catch (examErr) {
            console.error('Erreur lors du chargement de l\'examen:', examErr);
            if (isMounted.current) {
              setError('Impossible de charger les détails de l\'examen. Veuillez réessayer.');
            }
          }
        } else if (location.state?.submissionId) {
          // Vue étudiant avec ID de soumission
          await loadSubmission(location.state.submissionId, location.state);
        } else {
          throw new Error('Aucune soumission ou examen spécifié');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des résultats:', err);
        if (isMounted.current) {
          setError('Impossible de charger les résultats. Veuillez réessayer.');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    // Fonction pour charger une soumission
    const loadSubmission = async (submissionId, state) => {
      if (!isMounted.current) return;
      
      try {
        const sub = await submissionService.getSubmission(submissionId);
        
        if (isMounted.current) {
          // Préparer les données de soumission avec des valeurs par défaut pour éviter les erreurs
          const submissionData = {
            ...sub,
            correct_answers: state?.correctAnswers ?? sub.correct_answers ?? 0,
            total_questions: state?.totalQuestions ?? sub.total_questions ?? 0,
            percentage: state?.percentage ?? sub.percentage ?? 0,
            score: sub.score ?? 0,
            max_score: sub.max_score ?? 100,
            answers: sub.answers || [],
            submitted_at: sub.submitted_at || new Date().toISOString()
          };
          
          console.log('Données de soumission chargées:', submissionData);
          setSubmission(submissionData);
          
          // Si l'examen n'est pas encore chargé, le charger
          if (sub.exam_id && !exam) {
            try {
              const examData = await examService.getExam(sub.exam_id);
              if (isMounted.current) {
                setExam(examData);
              }
            } catch (examErr) {
              console.error('Erreur lors du chargement de l\'examen:', examErr);
              if (isMounted.current) {
                setError(prev => prev + ' Impossible de charger les détails de l\'examen.');
              }
            }
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la soumission:', err);
        if (isMounted.current) {
          setError('Impossible de charger les détails de la soumission.');
        }
        throw err;
      }
    };
    
    loadData();
    
    // Nettoyage
    return () => {
      isMounted.current = false;
    };
  }, [examId, location.state]);

  const handleGeneratePdf = async () => {
    if (!isMounted.current) return;
    
    try {
      setIsGeneratingPdf(true);
      await examService.downloadResultsPdf(examId);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      if (isMounted.current) {
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de la génération du PDF.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      if (isMounted.current) {
        setIsGeneratingPdf(false);
      }
    }
  };

  const handleDownloadSignatures = async () => {
    if (!examId) return;
    setIsDownloadingSignatures(true);
    try {
      const result = await examService.downloadSignaturesSheet(examId);
      if (result.success) {
        toast({
          title: 'Téléchargement lancé',
          description: "La feuille d'émargement est en cours de téléchargement.",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.message || 'Erreur inconnue');
      }
    } catch (err) {
      toast({
        title: 'Erreur de téléchargement',
        description: err.response?.data?.detail || err.message || "Impossible de générer la feuille d'émargement.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDownloadingSignatures(false);
    }
  };

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    onOpen();
  };

  if (loading) {
    return (
      <Container maxW="container.md" py={10} centerContent>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Chargement des résultats en cours...</Text>
        </VStack>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertTitle>Erreur lors du chargement</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          leftIcon={<FaHome />} 
          colorScheme="blue" 
          onClick={() => navigate(ROUTES.HOME)}
        >
          Retour à l'accueil
        </Button>
      </Container>
    );
  }
  
  // Vue enseignant - Liste de toutes les soumissions
  if (isTeacherView) {
    if (!allSubmissions || allSubmissions.length === 0) {
      return (
        <Container maxW="container.md" py={10}>
          <Alert status="info" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertTitle>Aucune soumission pour cet examen</AlertTitle>
            <AlertDescription>
              Aucun étudiant n'a encore soumis de réponse pour cet examen.
            </AlertDescription>
          </Alert>
          <Button 
            leftIcon={<FaHome />} 
            colorScheme="blue" 
            onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
          >
            Retour au tableau de bord
          </Button>
        </Container>
      );
    }

    const calculateAverageScore = () => {
      if (allSubmissions.length === 0) return 0;
      const total = allSubmissions.reduce((sum, sub) => {
        return sum + (sub.score / sub.max_score) * 100;
      }, 0);
      return total / allSubmissions.length;
    };

    const averageScore = calculateAverageScore();

    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading as="h1" size="xl" mb={2}>Résultats de l'examen : {exam?.title}</Heading>
            <Text fontSize="lg" color="gray.600">{exam?.description}</Text>
            <Button
              mt={4}
              colorScheme="teal"
              leftIcon={<FaFilePdf />}
              onClick={handleDownloadPdf}
              isLoading={isDownloadingPdf}
            >
              Télécharger la feuille d'émargement
            </Button>
          </Box>

          <StatGroup>
            <Stat>
              <StatLabel>Soumissions totales</StatLabel>
              <StatNumber>{allSubmissions.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Score moyen</StatLabel>
              <StatNumber>{averageScore.toFixed(2)}%</StatNumber>
            </Stat>
          </StatGroup>

          <Heading as="h2" size="lg">Détails des soumissions</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {allSubmissions.map(sub => (
              <ResultCard key={sub.id} submission={sub} exam={exam} />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }
  
  if (!submission) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="warning" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertTitle>Aucune donnée de soumission disponible</AlertTitle>
          <AlertDescription>
            Impossible de trouver les résultats de l'examen. Veuillez réessayer ou contacter l'administrateur.
          </AlertDescription>
        </Alert>
        <Button 
          leftIcon={<FaHome />} 
          colorScheme="blue" 
          onClick={() => navigate(ROUTES.HOME)}
        >
          Retour à l'accueil
        </Button>
      </Container>
    );
  }

  // Vue détaillée d'une soumission
  if (submission) {
    return (
      <Container maxW="container.md" py={8}>
        <ResultCard submission={submission} exam={exam} />
      </Container>
    );
  }

  // Fallback si rien n'est chargé
  return (
    <Container maxW="container.md" py={10} centerContent>
      <Alert status="info">
        <AlertIcon />
        Aucun résultat à afficher.
      </Alert>
    </Container>
  );
};

export default ExamResultsPage;
